from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from tgbot.config import load_config

# Load configuration
config = load_config(".env")
auth_config = config.auth

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: The data to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=auth_config.access_token_expire_minutes)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, auth_config.secret_key, algorithm=auth_config.algorithm)
    
    return encoded_jwt

def decode_token(token: str) -> TokenData:
    """
    Decode a JWT token and extract the data.
    
    Args:
        token: The JWT token to decode
        
    Returns:
        The decoded token data
        
    Raises:
        HTTPException: If the token is invalid
    """
    try:
        payload = jwt.decode(token, auth_config.secret_key, algorithms=[auth_config.algorithm])
        username = payload.get("sub")
        user_id = payload.get("user_id")
        role = payload.get("role")
        
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return TokenData(username=username, user_id=user_id, role=role)
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_token_data(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Get the current user's token data from the JWT token.
    
    Args:
        token: The JWT token from the Authorization header
        
    Returns:
        The decoded token data
    """
    return decode_token(token)