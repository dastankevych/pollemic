from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext

from infrastructure.database.repo.requests import RequestsRepo
from tgbot.misc.states import QuestionnaireAnswering
from tgbot.keyboards.inline import get_confirm_cancel_keyboard

user_router = Router()


@user_router.message(CommandStart(deep_link=True))
async def handle_deep_link(message: Message, state: FSMContext, repo: RequestsRepo):
    """Handle deep link start command"""
    # Extract action and payload from deep link
    args = message.get_args()
    action, *payload = args.split('_')

    if action == 'q' and payload:
        try:
            # Get assignment details
            assignment_id = int(payload[0])
            assignment = await repo.questionnaires.get_assignment(assignment_id)

            if not assignment:
                await message.answer("❌ Опрос не найден или больше не доступен.")
                return

            if not assignment.is_active:
                await message.answer("❌ Этот опрос больше не активен.")
                return

            # Check if user already completed this questionnaire
            user_responses = await repo.responses.get_user_responses(
                assignment_id=assignment_id,
                user_id=message.from_user.id
            )

            if user_responses and user_responses.is_completed:
                await message.answer("✅ Вы уже прошли этот опрос. Спасибо за участие!")
                return

            # Store assignment ID and reset question index in state
            await state.set_state(QuestionnaireAnswering.answering)
            await state.update_data(
                assignment_id=assignment_id,
                current_question=0,
                answers={},
                total_questions=len(assignment.questionnaire.questions)
            )

            # Show questionnaire intro
            questionnaire = assignment.questionnaire
            await message.answer(
                f"📝 <b>{questionnaire.title}</b>\n\n"
                f"{questionnaire.description}\n\n"
                f"Всего вопросов: {len(questionnaire.questions)}\n"
                f"Начнем отвечать на вопросы!"
            )

            # Show first question
            await show_current_question(message, state, repo)

        except ValueError:
            await message.answer("❌ Некорректная ссылка на опрос.")
        except Exception as e:
            await message.answer(f"❌ Ошибка при загрузке опроса: {str(e)}")
            await state.clear()
    else:
        await message.answer("Добро пожаловать! Используйте меню для начала работы.")


@user_router.message(CommandStart())
async def user_start(message: Message):
    await message.reply("Добро пожаловать! Используйте меню для начала работы.")


async def show_current_question(message: Message, state: FSMContext, repo: RequestsRepo):
    """
    Показать текущий вопрос пользователю
    """
    # Get current data from state
    data = await state.get_data()
    assignment_id = data["assignment_id"]
    current_question_idx = data["current_question"]

    # Get assignment and questionnaire details
    assignment = await repo.questionnaires.get_assignment(assignment_id)
    questionnaire = assignment.questionnaire

    # Check if we've shown all questions
    if current_question_idx >= len(questionnaire.questions):
        # All questions have been answered, show summary and confirmation
        await show_answers_summary(message, state, repo)
        return

    # Get current question
    question_data = questionnaire.questions[current_question_idx]
    question_type = question_data.get("type", "free_form")
    question_text = question_data.get("question", "")

    # Format question number
    question_num = current_question_idx + 1
    total_questions = len(questionnaire.questions)

    # Prepare question message
    question_message = (
        f"❓ <b>Вопрос {question_num}/{total_questions}</b>\n\n"
        f"{question_text}"
    )

    # Send question based on type
    if question_type == "multiple_choice":
        options = question_data.get("options", [])
        options_text = "\n".join([f"{i+1}. {option}" for i, option in enumerate(options)])

        await message.answer(
            f"{question_message}\n\n"
            f"Варианты ответа:\n{options_text}\n\n"
            f"Пожалуйста, отправьте номер выбранного варианта."
        )
    else:
        # Free form question
        await message.answer(
            f"{question_message}\n\n"
            f"Пожалуйста, напишите ваш ответ."
        )


@user_router.message(QuestionnaireAnswering.answering)
async def process_answer(message: Message, state: FSMContext, repo: RequestsRepo):
    """
    Обработать ответ пользователя на вопрос
    """
    # Get current data from state
    data = await state.get_data()
    assignment_id = data["assignment_id"]
    current_question_idx = data["current_question"]
    answers = data.get("answers", {})

    # Get assignment and questionnaire details
    assignment = await repo.questionnaires.get_assignment(assignment_id)
    questionnaire = assignment.questionnaire
    question_data = questionnaire.questions[current_question_idx]
    question_type = question_data.get("type", "free_form")

    # Process answer based on the question type
    if question_type == "multiple_choice":
        options = question_data.get("options", [])

        try:
            # Try to parse as integer option number
            option_num = int(message.text.strip())

            # Check if option number is valid
            if 1 <= option_num <= len(options):
                selected_option = options[option_num - 1]

                # Save the answer
                answers[str(current_question_idx)] = {
                    "question": question_data.get("question", ""),
                    "answer": selected_option,
                    "option_index": option_num - 1
                }

                await message.answer(f"✅ Выбран вариант: {selected_option}")
            else:
                await message.answer(
                    f"❌ Пожалуйста, выберите вариант от 1 до {len(options)}.\n"
                    f"Попробуйте еще раз."
                )
                return  # Don't proceed to next question
        except ValueError:
            # Not a number, try to match text
            user_text = message.text.lower().strip()
            found_match = False

            for i, option in enumerate(options):
                if user_text == option.lower().strip():
                    answers[str(current_question_idx)] = {
                        "question": question_data.get("question", ""),
                        "answer": option,
                        "option_index": i
                    }
                    await message.answer(f"✅ Выбран вариант: {option}")
                    found_match = True
                    break

            if not found_match:
                await message.answer(
                    "❌ Пожалуйста, выберите один из предложенных вариантов, указав его номер.\n"
                    "Попробуйте еще раз."
                )
                return  # Don't proceed to next question
    else:
        # Free form question, save the text response
        answers[str(current_question_idx)] = {
            "question": question_data.get("question", ""),
            "answer": message.text
        }
        await message.answer("✅ Ваш ответ сохранен.")

    # Update state with new answers and move to next question
    current_question_idx += 1
    await state.update_data(
        current_question=current_question_idx,
        answers=answers
    )

    # Show next question or summary if all questions are answered
    await show_current_question(message, state, repo)


async def show_answers_summary(message: Message, state: FSMContext, repo: RequestsRepo):
    """
    Показать сводку ответов и запросить подтверждение отправки
    """
    data = await state.get_data()
    assignment_id = data["assignment_id"]
    answers = data.get("answers", {})

    # Get assignment details
    assignment = await repo.questionnaires.get_assignment(assignment_id)
    questionnaire = assignment.questionnaire

    # Prepare summary message
    summary_text = (
        f"📋 <b>Сводка ваших ответов на опрос</b>\n"
        f"<b>{questionnaire.title}</b>\n\n"
    )

    # Add each question and answer to summary
    for i, question_data in enumerate(questionnaire.questions):
        question_idx = str(i)
        if question_idx in answers:
            answer = answers[question_idx]
            summary_text += (
                f"<b>Вопрос {i+1}:</b> {answer['question']}\n"
                f"<b>Ваш ответ:</b> {answer['answer']}\n\n"
            )

    # Add confirmation request
    summary_text += (
        "Пожалуйста, проверьте ваши ответы.\n"
        "Нажмите «Подтвердить», чтобы отправить ответы, или «Отменить» для отмены."
    )

    # Change state to confirmation
    await state.set_state(QuestionnaireAnswering.confirmation)

    # Send summary with confirm/cancel buttons
    await message.answer(
        summary_text,
        reply_markup=get_confirm_cancel_keyboard()
    )


@user_router.callback_query(QuestionnaireAnswering.confirmation, F.data == "confirm")
async def confirm_submission(callback: CallbackQuery, state: FSMContext, repo: RequestsRepo):
    """
    Обработчик подтверждения отправки ответов
    """
    await callback.answer()

    data = await state.get_data()
    assignment_id = data["assignment_id"]
    answers = data.get("answers", {})

    # Save responses to database
    try:
        # Create response record
        response = await repo.responses.submit_response(
            assignment_id=assignment_id,
            student_id=callback.from_user.id,
            answers=answers
        )

        # Get assignment details for the thank you message
        assignment = await repo.questionnaires.get_assignment(assignment_id)

        # Confirm submission to user
        await callback.message.edit_text(
            f"✅ <b>Ваши ответы успешно отправлены!</b>\n\n"
            f"Спасибо за участие в опросе «{assignment.questionnaire.title}»."
        )

        # Clear state
        await state.clear()

    except Exception as e:
        await callback.message.edit_text(
            f"❌ <b>Произошла ошибка при сохранении ваших ответов:</b>\n{str(e)}\n\n"
            f"Пожалуйста, попробуйте еще раз или обратитесь к администратору."
        )


@user_router.callback_query(QuestionnaireAnswering.confirmation, F.data == "cancel")
async def cancel_submission(callback: CallbackQuery, state: FSMContext):
    """
    Обработчик отмены отправки ответов
    """
    await callback.answer()

    # Inform user
    await callback.message.edit_text(
        "❌ <b>Отправка ответов отменена.</b>\n\n"
        "Вы можете пройти опрос позже, перейдя по ссылке снова."
    )

    # Clear state
    await state.clear()