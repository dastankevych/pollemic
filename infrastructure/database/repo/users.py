from typing import Optional

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select

from infrastructure.database.models import User, UserRole
from .base import BaseRepo


class UserRepo(BaseRepo):
    async def create_user(
        self,
        user_id: int,
        full_name: str,
        username: Optional[str] = None,
        role: UserRole = UserRole.STUDENT,
    ) -> User:
        """
        Creates a new user in the database and returns the user object.
        """
        insert_stmt = (
            insert(User)
            .values(
                user_id=user_id,
                username=username,
                full_name=full_name,
                role=role,
            )
            .returning(User)
        )
        result = await self.session.execute(insert_stmt)
        await self.session.commit()
        return result.scalar_one()

    async def update_user(
        self,
        user_id: int,
        full_name: str,
        username: Optional[str] = None,
    ) -> Optional[User]:
        """
        Updates an existing user in the database and returns the user object.
        """
        update_stmt = (
            insert(User)
            .values(
                user_id=user_id,
                username=username,
                full_name=full_name,
            )
            .on_conflict_do_update(
                index_elements=[User.user_id],
                set_=dict(
                    username=username,
                    full_name=full_name,
                ),
            )
            .returning(User)
        )
        result = await self.session.execute(update_stmt)
        await self.session.commit()
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return await self.session.get(User, user_id)

    async def set_role(self, user_id: int, role: UserRole) -> Optional[User]:
        """Set user role"""
        user = await self.get_user(user_id)
        if user:
            user.role = role
            await self.session.commit()
            await self.session.refresh(user)
        return user
