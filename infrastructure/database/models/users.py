from enum import Enum
from typing import Optional

from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy import BIGINT, Boolean, true
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin

class UserRole(str, Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    UNIVERSITY_ADMIN = "university_admin"


class User(Base, TimestampMixin):
    """
    This class represents a User in the application with different roles.

    Attributes:
        id (Mapped[int]): The unique identifier of the user.
        username (Mapped[Optional[str]]): The telegram username of the user.
        full_name (Mapped[str]): The full name of the user.
        active (Mapped[bool]): Indicates whether the user is active or not.

        role (Mapped[UserRole]): The role of the user (student/mentor/university_admin)

    Methods:
        is_student(): Returns True if the user is a student
        is_mentor(): Returns True if the user is a mentor
        is_admin(): Returns True if the user is a university admin
        can_view_anonymous_data(): Returns True if user can view anonymous data
        can_view_full_data(): Returns True if user can view full data
    """
    id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(128))
    full_name: Mapped[str] = mapped_column(String(128))
    active: Mapped[bool] = mapped_column(Boolean, server_default=true())
    role: Mapped["UserRole"] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", create_type=False), 
        nullable=False
    )

    def __repr__(self):
        return f"<User {self.id} {self.username} {self.full_name} ({self.role})>"

    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT

    def is_mentor(self) -> bool:
        return self.role == UserRole.MENTOR

    def is_admin(self) -> bool:
        return self.role == UserRole.UNIVERSITY_ADMIN

    def can_view_anonymous_data(self) -> bool:
        """Returns True if user can view anonymous data (mentors and admins)"""
        return self.role in [UserRole.MENTOR, UserRole.UNIVERSITY_ADMIN]

    def can_view_full_data(self) -> bool:
        """Returns True if user can view full data (only admins)"""
        return self.role == UserRole.UNIVERSITY_ADMIN
