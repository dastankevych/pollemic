from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from infrastructure.database.models import User, UserRole
from infrastructure.database.repo.users import UserRepo
from infrastructure.api.dependencies import get_user_repo
from infrastructure.api.security.token import create_access_token, TokenData, get_current_token_data
from tgbot.config import load_config

# Load configuration
config = load_config(".env")
auth_config = config.auth

router = APIRouter(prefix="/auth", tags=["authentication"])


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    user_id: int
    username: Optional[str] = None
    full_name: str
    role: str


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    user_repo: UserRepo = Depends(get_user_repo)
):
    """
    Authenticate user and return JWT token
    """
    user = await user_repo.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token data
    token_data = {
        "sub": user.username,
        "user_id": user.user_id,
        "role": user.role.value
    }
    
    # Create access token
    access_token = create_access_token(
        data=token_data,
        expires_delta=timedelta(minutes=auth_config.access_token_expire_minutes)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    token_data: TokenData = Depends(get_current_token_data),
    user_repo: UserRepo = Depends(get_user_repo)
):
    """
    Get current authenticated user
    """
    if token_data.user_id is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await user_repo.get_user(token_data.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role.value
    }


# Helper functions for role-based access control
def is_mentor_or_admin(token_data: TokenData = Depends(get_current_token_data)):
    """
    Check if the current user is a mentor or admin
    """
    if token_data.role not in [UserRole.MENTOR.value, UserRole.UNIVERSITY_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return token_data


def is_admin(token_data: TokenData = Depends(get_current_token_data)):
    """
    Check if the current user is an admin
    """
    if token_data.role != UserRole.UNIVERSITY_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return token_data