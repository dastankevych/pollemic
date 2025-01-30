from aiogram.filters.callback_data import CallbackData
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from typing import Optional


def get_questionnaire_button(assignment_id: int, bot_username: str) -> InlineKeyboardMarkup:
    """
    Create button with deep link to questionnaire
    
    Args:
        assignment_id: ID of the questionnaire assignment
        bot_username: Bot's username for creating deep link
    """
    start_parameter = create_start_parameter('q', str(assignment_id))
    deep_link = get_deep_link(bot_username, start_parameter)
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[[
            InlineKeyboardButton(
                text="🔗 Open Questionnaire",
                url=deep_link
    )
        ]]
    )
    return keyboard


def get_done_button() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Done", callback_data="questions_done")]
        ]
    )


def get_groups_keyboard(groups: list) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=group.title, callback_data=f"group_{group.id}")]
            for group in groups
        ]
    )


def get_questionnaires_keyboard(questionnaires: list, current_page: int) -> InlineKeyboardMarkup:
    keyboard = []
    start_idx = current_page * QUESTIONNAIRES_PER_PAGE
    page_questionnaires = questionnaires[start_idx:start_idx + QUESTIONNAIRES_PER_PAGE]
    
    # Create 2-column layout
    for i in range(0, len(page_questionnaires), 2):
        row = []
        # Add first button in row
        row.append(InlineKeyboardButton(
            text=page_questionnaires[i].title[:20],  # Limit title length
            callback_data=f"questionnaire_{page_questionnaires[i].id}"
        ))
        # Add second button if exists
        if i + 1 < len(page_questionnaires):
            row.append(InlineKeyboardButton(
                text=page_questionnaires[i + 1].title[:20],
                callback_data=f"questionnaire_{page_questionnaires[i + 1].id}"
            ))
        keyboard.append(row)
    
    # Add navigation row
    nav_row = []
    total_pages = (len(questionnaires) - 1) // QUESTIONNAIRES_PER_PAGE + 1
    
    if current_page > 0:
        nav_row.append(InlineKeyboardButton(
            text="⬅️ Back",
            callback_data=f"page_{current_page - 1}"
        ))
    
    if current_page < total_pages - 1:
        nav_row.append(InlineKeyboardButton(
            text="Next ➡️",
            callback_data=f"page_{current_page + 1}"
        ))
    
    if nav_row:
        keyboard.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_groups_keyboard(groups: list) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=group.title,
                callback_data=f"group_{group.group_id}"
            )]
            for group in groups
        ]
    )


def get_confirm_cancel_assignment_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Confirm", callback_data="confirm_assignment"),
                InlineKeyboardButton(text="❌ Cancel", callback_data="cancel_assignment")
            ]
        ]
    )


def get_active_assignments_keyboard(assignments: list, current_page: int) -> InlineKeyboardMarkup:
    keyboard = []
    start_idx = current_page * QUESTIONNAIRES_PER_PAGE
    page_assignments = assignments[start_idx:start_idx + QUESTIONNAIRES_PER_PAGE]
    
    # Create 2-column layout
    for i in range(0, len(page_assignments), 2):
        row = []
        # First button
        assignment = page_assignments[i]
        row.append(InlineKeyboardButton(
            text=f"{assignment.questionnaire.title[:20]} ({assignment.group.title[:10]})",
            callback_data=f"close_assignment_{assignment.id}"
        ))
        # Second button if exists
        if i + 1 < len(page_assignments):
            assignment = page_assignments[i + 1]
            row.append(InlineKeyboardButton(
                text=f"{assignment.questionnaire.title[:20]} ({assignment.group.title[:10]})",
                callback_data=f"close_assignment_{assignment.id}"
            ))
        keyboard.append(row)
    
    # Add navigation row
    nav_row = []
    total_pages = (len(assignments) - 1) // QUESTIONNAIRES_PER_PAGE + 1
    
    if current_page > 0:
        nav_row.append(InlineKeyboardButton(
            text="⬅️ Back",
            callback_data=f"page_{current_page - 1}"
        ))
    
    if current_page < total_pages - 1:
        nav_row.append(InlineKeyboardButton(
            text="Next ➡️",
            callback_data=f"page_{current_page + 1}"
        ))
    
    if nav_row:
        keyboard.append(nav_row)
    
    return InlineKeyboardMarkup(inline_keyboard=keyboard)


def get_confirm_cancel_close_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Confirm Close", callback_data="confirm_close"),
                InlineKeyboardButton(text="❌ Cancel", callback_data="cancel_close")
            ]
        ]
    )


def create_start_parameter(action: str, payload: Optional[str] = None) -> str:
    """
    Create a start parameter for deep linking
    
    Args:
        action: Type of action ('q' for questionnaire, etc.)
        payload: Additional data (like questionnaire ID)
    
    Returns:
        Formatted start parameter (e.g., 'q_123' for questionnaire ID 123)
    """
    if payload:
        return f"{action}_{payload}"
    return action


def get_deep_link(bot_username: str, start_parameter: str) -> str:
    """
    Create a deep link URL
    
    Args:
        bot_username: Bot's username
        start_parameter: Start parameter created by create_start_parameter
        
    Returns:
        Full deep link URL
    """
    return f"https://t.me/{bot_username}?start={start_parameter}"
