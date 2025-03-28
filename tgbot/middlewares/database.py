from typing import Callable, Dict, Any, Awaitable, Union

from aiogram import BaseMiddleware
from aiogram.types import Message, CallbackQuery, ChatMemberUpdated

from infrastructure.database.models import UserRole
from infrastructure.database.repo.requests import RequestsRepo


class DatabaseMiddleware(BaseMiddleware):
    def __init__(self, session_pool) -> None:
        self.session_pool = session_pool

    async def __call__(
        self,
        handler: Callable[[Union[Message, CallbackQuery, ChatMemberUpdated], Dict[str, Any]], Awaitable[Any]],
        event: Union[Message, CallbackQuery, ChatMemberUpdated],
        data: Dict[str, Any],
    ) -> Any:
        async with self.session_pool() as session:
            repo = RequestsRepo(session)
            config = data.get("config")

            # Only try to get user info if the event has a from_user attribute
            if hasattr(event, 'from_user'):
                # Check if user is admin
                is_admin = config and event.from_user.id in config.tg_bot.admin_ids
                role = UserRole.UNIVERSITY_ADMIN if is_admin else UserRole.STUDENT

                user = await repo.users.get_or_create_user(
                    event.from_user.id,
                    event.from_user.full_name,
                    event.from_user.language_code,
                    event.from_user.username,
                    role=role
                )
                data["user"] = user

            data["session"] = session
            data["repo"] = repo

            return await handler(event, data)
