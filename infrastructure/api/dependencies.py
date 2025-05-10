from typing import Annotated, TypeVar, Type, AsyncGenerator, Optional, Callable

from fastapi import Header, Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from aiogram import Bot
import jwt

from infrastructure.database.repo.base import BaseRepo
from infrastructure.database.repo.requests import RequestsRepo
from infrastructure.database.repo.questionnaires import QuestionnaireRepo
from infrastructure.database.repo.users import UserRepo
from infrastructure.database.repo.groups import GroupRepo
from infrastructure.database.models import User, UserRole
from infrastructure.database.setup import create_engine, create_session_pool
from tgbot.config import load_config

# Initialize engine and session pool
config = load_config(".env")
engine = create_engine(config.db)
session_pool = create_session_pool(engine)

# JWT Configuration
SECRET_KEY = "your-secret-key-change-this-in-production"  # Use environment variables
ALGORITHM = "HS256"

# OAuth2 scheme for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=False)

# Generic type for repositories
RepoT = TypeVar('RepoT', bound=BaseRepo)


def get_bot():
    bot = Bot(token=config.tg_bot.token)
    return bot


async def get_session() -> AsyncGenerator[AsyncSession, None]:
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


# Authentication dependencies
async def get_current_user(
        token: str = Security(oauth2_scheme),
        user_repo: UserRepo = Depends(get_user_repo)
) -> Optional[User]:
    """Get the current user from authentication token"""
    if token is None:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")

        if user_id is None:
            return None

        user = await user_repo.get_user(user_id)
        return user
    except jwt.PyJWTError:
        return None


async def require_authentication(
        current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require a valid authenticated user"""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not current_user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def require_admin(
        current_user: User = Depends(require_authentication)
) -> User:
    """Require admin privileges"""
    if current_user.role != UserRole.UNIVERSITY_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def require_mentor_or_admin(
        current_user: User = Depends(require_authentication)
) -> User:
    """Require mentor or admin privileges"""
    if current_user.role not in [UserRole.MENTOR, UserRole.UNIVERSITY_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mentor or admin privileges required"
        )
    return current_user


# Functions to create role-based permission checks
def has_role(required_role: UserRole) -> Callable:
    async def check_role(
            current_user: User = Depends(require_authentication)
    ) -> User:
        if current_user.role != required_role and current_user.role != UserRole.UNIVERSITY_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"{required_role} role required"
            )
        return current_user
    return check_role