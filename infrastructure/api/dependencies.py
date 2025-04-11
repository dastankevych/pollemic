from typing import Annotated, TypeVar, Type
from fastapi import Header, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from aiogram import Bot

from infrastructure.database.repo.base import BaseRepo
from infrastructure.database.repo.requests import RequestsRepo
from infrastructure.database.repo.users import UserRepo
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.groups import GroupRepo
from infrastructure.database.setup import create_engine, create_session_pool
from tgbot.config import load_config

# Initialize engine and session pool
config = load_config(".env")
engine = create_engine(config.db)
session_pool = create_session_pool(engine)

# Generic type for repositories
RepoT = TypeVar('RepoT', bound=BaseRepo)


def get_bot():
    bot = Bot(token=config.tg_bot.token)
    return bot


async def get_session() -> AsyncSession:
    """Get database session"""
    async with session_pool() as session:
        yield session


def get_repo_factory(repo_type: Type[RepoT]):
    """Create a dependency function for a specific repository type"""

    async def get_specific_repo(session: AsyncSession = Depends(get_session)) -> RepoT:
        return repo_type(session=session)

    return get_specific_repo


# Specific repository dependencies
get_questionnaire_repo = get_repo_factory(QuestionnaireRepo)
get_user_repo = get_repo_factory(UserRepo)
get_requests_repo = get_repo_factory(RequestsRepo)
get_group_repo = get_repo_factory(GroupRepo)


async def is_api_request(
        accept: Annotated[str | None, Header()] = None
) -> bool:
    """Check if the request is an API request based on Accept header"""
    return accept and 'application/json' in accept
