from datetime import datetime, timedelta
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

# Define the auth router
router = APIRouter(prefix="/auth", tags=["authentication"])

# Configuration for JWT
# In production, these should be stored in environment variables
SECRET_KEY = "your-secret-key-change-this-in-production"  # Use environment variables
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

# OAuth2 scheme for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Function to create a JWT token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")

        if username is None or user_id is None:
            raise credentials_exception

        token_data = TokenData(username=username, user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception

    user = await user_repo.get_user(token_data.user_id)
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
    # Find user by username
    try:
        # In real application, query by username
        # This is a simplified approach for demonstration
        user = None
        # Query in the database by username
        # Simplified for demonstration, improve this in production
        if login_request.username == "admin":
            # Fake admin user
            user_id = 123456789  # Admin ID from environment file
            user = await user_repo.get_user(user_id)
            if not user:
                # Create admin if doesn't exist (for demo)
                user = await user_repo.get_or_create_user(
                    user_id=user_id,
                    username="admin",
                    full_name="Administrator",
                    role=UserRole.UNIVERSITY_ADMIN
                )
        elif login_request.username.startswith("mentor"):
            # Fake mentor users
            mentor_id = 223344556 if login_request.username == "mentor1" else 223344557
            user = await user_repo.get_user(mentor_id)
            if not user:
                # Create mentor if doesn't exist (for demo)
                user = await user_repo.get_or_create_user(
                    user_id=mentor_id,
                    username=login_request.username,
                    full_name=f"Mentor {login_request.username[-1]}",
                    role=UserRole.MENTOR,
                    department="Computer Science"
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
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username or str(user.user_id), "user_id": user.user_id, "role": user.role},
            expires_delta=access_token_expires
        )

        # Return token and user info
        return {
            "status": "success",
            "token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "full_name": user.full_name,
                "active": user.active,
                "language": user.language,
                "role": user.role,
                "department": user.department
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
            "user_id": current_user.user_id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "active": current_user.active,
            "language": current_user.language,
            "role": current_user.role,
            "department": current_user.department
        }
    }


# Get current user profile
@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return {
        "status": "success",
        "user": {
            "user_id": current_user.user_id,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "active": current_user.active,
            "language": current_user.language,
            "role": current_user.role,
            "department": current_user.department
        }
    }