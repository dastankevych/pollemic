from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from infrastructure.database.repo.users import UserRepo
from infrastructure.database.models import User, UserRole
from infrastructure.api.dependencies import get_user_repo

from infrastructure.api.schemas.token import (
    TokenData,
    LoginRequest,
)

from tgbot.config import load_config

# Configuration for JWT
config = load_config()

# Define the auth router
router = APIRouter(prefix="/auth", tags=["authentication"])

# OAuth2 scheme for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Function to create a JWT token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=config.auth.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, config.auth.secret_key, algorithm=config.auth.algorithm)
    return encoded_jwt


# Password verification (temporary simplified version)
# In production, use proper password hashing
def verify_password(plain_password: str, username: str) -> bool:
    # For testing purposes - in real application use secure hashing
    # This is a simplified approach for demonstration
    # Format: hash of "{username}:{password}"
    passwords = {
        "admin": "admin123",  # university_admin
        "mentor1": "mentor123",  # mentor
        "mentor2": "password",  # mentor
    }
    return username in passwords and plain_password == passwords[username]


# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), user_repo: UserRepo = Depends(get_user_repo)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, config.auth.secret_key, algorithms=[config.auth.algorithm])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")

        if username is None or user_id is None:
            raise credentials_exception

        token_data = TokenData(username=username, user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception

    user = await user_repo.get_user_by_id(token_data.user_id)
    if user is None:
        raise credentials_exception

    return user


# Get current active user
async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# Authenticate user and return token
@router.post("/login")
async def login_for_access_token(login_request: LoginRequest, user_repo: UserRepo = Depends(get_user_repo)):
    try:
        user = None

        if login_request.username == "admin":
            # First try to find existing admin
            user = await user_repo.get_user_by_username("admin")
            if not user:
                # Create admin if doesn't exist
                user = await user_repo.create_user(
                    username="admin",
                    full_name="Administrator",
                    role=UserRole.UNIVERSITY_ADMIN
                )
        elif login_request.username.startswith("mentor"):
            # Try to find existing mentor
            user = await user_repo.get_user_by_username(login_request.username)
            if not user:
                # Create mentor if doesn't exist
                user = await user_repo.create_user(
                    username=login_request.username,
                    full_name=f"Mentor {login_request.username[-1]}",
                    role=UserRole.MENTOR,
                )

        # Verify password and user exists
        if not user or not verify_password(login_request.password, login_request.username):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Only mentor and admin roles can log in
        if user.role not in [UserRole.MENTOR, UserRole.UNIVERSITY_ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Only mentors and administrators can log in.",
            )

        # Generate access token
        access_token_expires = timedelta(minutes=config.auth.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.username or str(user.id), "user_id": user.id, "role": user.role},
            expires_delta=access_token_expires
        )

        # Return token and user info
        return {
            "status": "success",
            "token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "active": user.active,
                "role": user.role,
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}"
        )


# Verify token endpoint
@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    return {
        "status": "success",
        "authenticated": True,
        "user": {
            "user_id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "active": current_user.active,
            "role": current_user.role,
        }
    }


# Get current user profile
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return {
        "status": "success",
        "user": {
            "user_id": current_user.id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "active": current_user.active,
            "role": current_user.role,
        }
    }