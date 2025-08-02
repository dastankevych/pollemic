from enum import Enum
from typing import Optional

from sqlalchemy import String, Enum as SQLEnum
from sqlalchemy import text, BIGINT, Boolean, true
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin, TableNameMixin


class UserRole(str, Enum):
    STUDENT = "student"
    MENTOR = "mentor"
    UNIVERSITY_ADMIN = "university_admin"


class User(Base, TimestampMixin, TableNameMixin):
    """
    This class represents a User in the application with different roles.

    Attributes:
        user_id (Mapped[int]): The unique identifier of the user.
        username (Mapped[Optional[str]]): The username of the user.
        full_name (Mapped[str]): The full name of the user.
        active (Mapped[bool]): Indicates whether the user is active or not.
        language (Mapped[str]): The language preference of the user.
        role (Mapped[UserRole]): The role of the user (student/mentor/university_admin)
        student_id (Mapped[Optional[str]]): Student ID number (only for students)
        department (Mapped[Optional[str]]): Department name (for mentors and admins)
        password_hash (Mapped[Optional[str]]): Hashed password for authentication

    Methods:
        is_student(): Returns True if the user is a student
        is_mentor(): Returns True if the user is a mentor
        is_admin(): Returns True if the user is a university admin
        can_view_anonymous_data(): Returns True if user can view anonymous data
        can_view_full_data(): Returns True if user can view full data
    """
    user_id: Mapped[int] = mapped_column(BIGINT, primary_key=True, autoincrement=False)
    username: Mapped[Optional[str]] = mapped_column(String(128))
    full_name: Mapped[str] = mapped_column(String(128))
    active: Mapped[bool] = mapped_column(Boolean, server_default=true())
    language: Mapped[str] = mapped_column(String(10), server_default=text("'en'"))
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", create_type=False), 
        nullable=False
    )
    student_id: Mapped[Optional[str]] = mapped_column(String(50))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    password_hash: Mapped[Optional[str]] = mapped_column(String(128))

    def __repr__(self):
        return f"<User {self.user_id} {self.username} {self.full_name} ({self.role})>"

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
