# tgbot/handlers/questionnaire.py
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from infrastructure.database.repo.users import UserRepo
from tgbot.keyboards.inline import (
    get_questionnaire_button, get_done_button,
    get_questionnaires_keyboard, get_groups_keyboard,
    get_confirm_cancel_assignment_keyboard,
    get_active_assignments_keyboard, get_confirm_cancel_close_keyboard
)
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext
from datetime import datetime

questionnaire_router = Router()


# Add states for the assignment process
class AssignmentStates(StatesGroup):
    WAITING_FOR_TITLE = State()
    WAITING_FOR_DESCRIPTION = State()
    WAITING_FOR_DATE = State()
    WAITING_FOR_QUESTIONS = State()
    REVIEW = State()


@questionnaire_router.message(Command("new_questionnaire"))
async def create_questionnaire(message: Message, state: FSMContext, repo: UserRepo):
    # Check if user is admin or mentor
    user = await repo.get_user(message.from_user.id)
    if not (user.is_admin() or user.is_mentor()):
        await message.answer("You don't have permission to create questionnaires.")
        return

    await state.set_state(AssignmentStates.WAITING_FOR_TITLE)
    await message.answer("Please enter the title for the questionnaire:")


@questionnaire_router.message(AssignmentStates.WAITING_FOR_TITLE)
async def process_title(message: Message, state: FSMContext):
    await state.update_data(title=message.text)
    await state.set_state(AssignmentStates.WAITING_FOR_DESCRIPTION)
    await message.answer("Please provide a description for the questionnaire:")


@questionnaire_router.message(AssignmentStates.WAITING_FOR_DESCRIPTION)
async def process_description(message: Message, state: FSMContext):
    await state.update_data(description=message.text)
    await state.set_state(AssignmentStates.WAITING_FOR_DATE)
    await message.answer("Please enter the due date in format DD/MM/YYYY HH:MM:")


@questionnaire_router.message(AssignmentStates.WAITING_FOR_DATE)
async def process_date(message: Message, state: FSMContext):
    try:
        due_date = datetime.strptime(message.text, "%d/%m/%Y %H:%M")
        await state.update_data(due_date=due_date)
        await state.set_state(AssignmentStates.WAITING_FOR_QUESTIONS)
        await message.answer(
            "Now let's add questions. You can:\n"
            "1. Send a question with options in format:\n"
            "Q: Question text\n"
            "A: Option 1, Option 2, Option 3\n\n"
            "2. OR send a free-form question (max 255 characters)\n\n"
            "When finished, click 'Done' button.",
            reply_markup=get_done_button()
        )
    except ValueError:
        await message.answer("Invalid date format. Please use DD/MM/YYYY HH:MM:")


@questionnaire_router.message(AssignmentStates.WAITING_FOR_QUESTIONS)
async def process_question(message: Message, state: FSMContext):
    data = await state.get_data()
    questions = data.get("questions", [])

    # Check if the message is in Q&A format
    if message.text.startswith("Q:") and "\nA:" in message.text:
        try:
            q_text = message.text.split("\nA: ")
            question = q_text[0].replace("Q: ", "")
            options = [opt.strip() for opt in q_text[1].split(",")]

            questions.append({
                "type": "multiple_choice",
                "question": question,
                "options": options
            })
        except:
            await message.answer("Invalid format. Please use:\nQ: Question text\nA: Option 1, Option 2, Option 3")
            return
    else:
        # Free-form question
        if len(message.text) > 255:
            await message.answer("Question is too long. Please keep it under 255 characters.")
            return

        questions.append({
            "type": "free_form",
            "question": message.text,
        })

    await state.update_data(questions=questions)
    await message.answer(
        f"Question added! Total questions: {len(questions)}\n"
        "Add another question or click 'Done' to finish.",
        reply_markup=get_done_button()
    )


@questionnaire_router.callback_query(F.data == "questions_done")
async def review_questionnaire(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()

    # Format review message
    review_text = (
        f"📋 Questionnaire Review\n\n"
        f"Title: {data['title']}\n"
        f"Description: {data['description']}\n"
        f"Due Date: {data['due_date'].strftime('%d/%m/%Y %H:%M')}\n\n"
        f"Questions:\n"
    )

    for i, q in enumerate(data['questions'], 1):
        review_text += f"\n{i}. {q['question']}\n"
        if q['type'] == 'multiple_choice':
            review_text += "Options: " + ", ".join(q['options']) + "\n"
        else:
            review_text += "(Free-form answer)\n"

    await state.set_state(AssignmentStates.REVIEW)
    await callback.message.edit_text(
        review_text,
        reply_markup=get_confirm_cancel_keyboard()
    )


@questionnaire_router.callback_query(F.data == "confirm_questionnaire")
async def save_questionnaire(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    data = await state.get_data()

    # Create questionnaire in DB
    questionnaire = await repo.create_questionnaire(
        title=data['title'],
        description=data['description'],
        questions=data['questions'],
        created_by=callback.from_user.id
    )

    await state.clear()
    await callback.message.edit_text(
        "✅ Questionnaire has been successfully created!\n"
        f"ID: {questionnaire.id}\n"
        "Use /assign command to assign it to a group."
    )


@questionnaire_router.callback_query(F.data == "cancel_questionnaire")
async def cancel_questionnaire(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ Questionnaire creation cancelled.")


QUESTIONNAIRES_PER_PAGE = 6  # 2 columns × 3 rows


@questionnaire_router.message(Command("assign"))
async def assign_questionnaire(message: Message, state: FSMContext, repo: UserRepo):
    # Check if user is admin or mentor
    user = await repo.get_user(message.from_user.id)
    if not (user.is_admin() or user.is_mentor()):
        await message.answer("You don't have permission to assign questionnaires.")
        return

    # Get questionnaires and store in state
    questionnaires = await repo.get_all_questionnaires()
    await state.update_data(
        questionnaires=questionnaires,
        current_page=0,
        total_pages=(len(questionnaires) - 1) // QUESTIONNAIRES_PER_PAGE + 1
    )

    await message.answer(
        "Select questionnaire:",
        reply_markup=get_questionnaires_keyboard(questionnaires, 0)
    )


@questionnaire_router.callback_query(F.data.startswith("page_"))
async def handle_pagination(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    data = await state.get_data()

    # Get new page number
    new_page = int(callback.data.split("_")[1])
    await state.update_data(current_page=new_page)

    await callback.message.edit_reply_markup(
        reply_markup=get_questionnaires_keyboard(
            data['questionnaires'],
            new_page
        )
    )


@questionnaire_router.callback_query(F.data.startswith("questionnaire_"))
async def show_questionnaire_details(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    await callback.answer()
    questionnaire_id = int(callback.data.split("_")[1])

    # Get questionnaire details
    questionnaire = await repo.get_questionnaire(questionnaire_id)
    await state.update_data(selected_questionnaire=questionnaire)

    # Format questionnaire details
    details_text = (
        f"📋 Selected Questionnaire\n\n"
        f"Title: {questionnaire.title}\n"
        f"Description: {questionnaire.description}\n\n"
        f"Questions:\n"
    )

    for i, q in enumerate(questionnaire.questions, 1):
        details_text += f"\n{i}. {q['question']}\n"
        if q['type'] == 'multiple_choice':
            details_text += "Options: " + ", ".join(q['options']) + "\n"
        else:
            details_text += "(Free-form answer)\n"

    # Send questionnaire details
    await callback.message.edit_text(details_text)

    # Get available groups and send as separate message
    groups = await repo.get_active_groups()
    await callback.message.answer(
        "Select group to assign:",
        reply_markup=get_groups_keyboard(groups)
    )


@questionnaire_router.callback_query(F.data.startswith("group_"))
async def confirm_assignment(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    await callback.answer()
    data = await state.get_data()
    group_id = int(callback.data.split("_")[1])

    questionnaire = data['selected_questionnaire']
    group = await repo.get_group(group_id)

    confirmation_text = (
        f"Please confirm assignment:\n\n"
        f"Questionnaire: {questionnaire.title}\n"
        f"Group: {group.title}\n"
    )

    await state.update_data(selected_group_id=group_id)
    await callback.message.edit_text(
        confirmation_text,
        reply_markup=get_confirm_cancel_assignment_keyboard()
    )


@questionnaire_router.callback_query(F.data == "confirm_assignment")
async def save_assignment(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    data = await state.get_data()

    try:
        # Create assignment
        assignment = await repo.assign_questionnaire(
            questionnaire_id=data['selected_questionnaire'].id,
            group_id=data['selected_group_id'],
            due_date=data['selected_questionnaire'].due_date
        )

        # Get questionnaire and group details
        questionnaire = await repo.get_questionnaire(assignment.questionnaire_id)
        group = await repo.get_group(assignment.group_id)

        # Format announcement message
        announcement_text = (
            f"📝 New Questionnaire\n\n"
            f"Title: {questionnaire.title}\n"
            f"Description: {questionnaire.description}\n"
            f"Due Date: {assignment.due_date.strftime('%d/%m/%Y %H:%M')}\n\n"
            f"Please click the button below to start answering:"
        )

        # Send announcement to the group
        await callback.bot.send_message(
            chat_id=group.group_id,
            text=announcement_text,
            reply_markup=get_questionnaire_button(
                assignment_id=assignment.id,
                bot_username=callback.bot.username
            )
        )

        await state.clear()
        await callback.message.edit_text("✅ Questionnaire has been successfully assigned!")

    except Exception as e:
        await state.clear()
        await callback.message.edit_text(
            f"❌ Error assigning questionnaire: {str(e)}"
        )


@questionnaire_router.callback_query(F.data == "cancel_assignment")
async def cancel_assignment(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ Assignment cancelled.")


@questionnaire_router.message(Command("close_questionnaire"))
async def list_active_assignments(message: Message, state: FSMContext, repo: UserRepo):
    # Check if user is admin or mentor
    user = await repo.get_user(message.from_user.id)
    if not (user.is_admin() or user.is_mentor()):
        await message.answer("You don't have permission to close questionnaires.")
        return

    # Get active assignments
    assignments = await repo.get_active_assignments()
    if not assignments:
        await message.answer("No active questionnaires found.")
        return

    await state.update_data(
        assignments=assignments,
        current_page=0,
        total_pages=(len(assignments) - 1) // QUESTIONNAIRES_PER_PAGE + 1
    )

    await message.answer(
        "Select questionnaire to close:",
        reply_markup=get_active_assignments_keyboard(assignments, 0)
    )


@questionnaire_router.callback_query(F.data.startswith("close_assignment_"))
async def confirm_close_assignment(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    await callback.answer()
    assignment_id = int(callback.data.split("_")[2])

    # Get assignment details
    assignment = await repo.get_assignment(assignment_id)
    await state.update_data(selected_assignment=assignment)

    # Format confirmation message
    confirmation_text = (
        f"⚠️ Are you sure you want to close this questionnaire?\n\n"
        f"Title: {assignment.questionnaire.title}\n"
        f"Group: {assignment.group.title}\n"
        f"Due date: {assignment.due_date.strftime('%d/%m/%Y %H:%M')}\n\n"
        f"This will:\n"
        f"- Stop accepting new responses\n"
        f"- Mark the questionnaire as closed\n"
        f"- Notify the group"
    )

    await callback.message.edit_text(
        confirmation_text,
        reply_markup=get_confirm_cancel_close_keyboard()
    )


@questionnaire_router.callback_query(F.data == "confirm_close")
async def close_assignment(callback: CallbackQuery, state: FSMContext, repo: UserRepo):
    data = await state.get_data()
    assignment = data['selected_assignment']

    # Close the assignment
    await repo.close_assignment(assignment.id)

    # Send notification to the group
    notification_text = (
        f"📝 Questionnaire Closed\n\n"
        f"Title: {assignment.questionnaire.title}\n"
        f"No more responses will be accepted."
    )

    await callback.bot.send_message(
        chat_id=assignment.group.group_id,
        text=notification_text
    )

    await state.clear()
    await callback.message.edit_text("✅ Questionnaire has been successfully closed!")


@questionnaire_router.callback_query(F.data == "cancel_close")
async def cancel_close(callback: CallbackQuery, state: FSMContext):
    await state.clear()
    await callback.message.edit_text("❌ Operation cancelled.")
