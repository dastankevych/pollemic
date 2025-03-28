# tgbot/states/questionnaire.py
from aiogram.fsm.state import State, StatesGroup


class QuestionnaireCreation(StatesGroup):
    waiting_for_title = State()
    waiting_for_description = State()
    waiting_for_questions = State()
    waiting_for_confirmation = State()


class QuestionnaireAnswering(StatesGroup):
    answering = State()
    confirmation = State()
