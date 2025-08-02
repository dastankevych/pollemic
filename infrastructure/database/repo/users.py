from typing import Optional

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select

from infrastructure.database.models import User, UserRole
from infrastructure.api.security.password import verify_password, get_password_hash
from .base import BaseRepo


class UserRepo(BaseRepo):
    async def get_or_create_user(
        self,
        user_id: int,
        full_name: str,
        username: Optional[str] = None,
        role: UserRole = UserRole.STUDENT,
        password: Optional[str] = None,
    ) -> User:
        """
        Creates or updates a new user in the database and returns the user object.
        """
        # Create values dict
        values = {
            "user_id": user_id,
            "username": username,
            "full_name": full_name,
            "role": role,
        }
        
        # Add password hash if password is provided
        if password:
            values["password_hash"] = get_password_hash(password)
            
        insert_stmt = (
            insert(User)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[User.user_id],
                set_=dict(
                    username=username,
                    full_name=full_name,
                ),
            )
            .returning(User)
        )
        result = await self.session.execute(insert_stmt)
        await self.session.commit()
        return result.scalar_one()

    async def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return await self.session.get(User, user_id)
        
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        query = select(User).where(User.username == username)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def set_role(self, user_id: int, role: UserRole) -> Optional[User]:
        """Set user role"""
        user = await self.get_user(user_id)
        if user:
            user.role = role
            await self.session.commit()
            await self.session.refresh(user)
        return user
        
    async def set_password(self, user_id: int, password: str) -> Optional[User]:
        """Set user password"""
        user = await self.get_user(user_id)
        if user:
            user.password_hash = get_password_hash(password)
            await self.session.commit()
            await self.session.refresh(user)
        return user
        
    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate a user by username and password.
        
        Args:
            username: The username to authenticate
            password: The password to verify
            
        Returns:
            The authenticated user if successful, None otherwise
        """
        user = await self.get_user_by_username(username)
        
        if not user or not user.password_hash:
            return None
            
        if not verify_password(password, user.password_hash):
            return None
            
        return user
