from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from infrastructure.database.repo.requests import RequestsRepo
from tgbot.misc.states import QuestionnaireAnswering

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
                await message.answer("❌ Questionnaire not found or no longer available.")
                return

            if not assignment.is_active:
                await message.answer("❌ This questionnaire is no longer active.")
                return

            # Store assignment ID in state
            await state.set_state(QuestionnaireAnswering.answering)
            await state.update_data(assignment_id=assignment_id)

            # Show first question
            questionnaire = assignment.questionnaire
            await message.answer(
                f"📝 {questionnaire.title}\n\n"
                f"{questionnaire.description}\n\n"
                f"Let's start answering the questions!"
            )
            # TODO: Implement showing first question

        except ValueError:
            await message.answer("❌ Invalid questionnaire link.")
        except Exception as e:
            await message.answer("❌ Error loading questionnaire. Please try again later.")
    else:
        await message.answer("Welcome! Please use the menu to get started.")


@user_router.message(CommandStart())
async def user_start(message: Message):
    await message.reply("Welcome! Please use the menu to get started.")
