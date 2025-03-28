from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy import BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .users import User


class StudentProfile(Base, TimestampMixin):
    """
    Additional information specific to students.
    
    Attributes:
        student_id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        year_of_study (Mapped[int]): Current year of study
        major (Mapped[str]): Student's major/field of study
        user (Mapped[User]): Relationship to User model
    """
    __tablename__ = "student_profiles"

    student_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    user_id: Mapped[int] = mapped_column(BIGINT, ForeignKey("users.user_id"), unique=True)
    year_of_study: Mapped[int] = mapped_column(Integer)
    major: Mapped[str] = mapped_column(String(100))

    user: Mapped[User] = relationship("User", backref="student_profile")


class MentorProfile(Base, TimestampMixin):
    """
    Additional information specific to mentors.
    
    Attributes:
        mentor_id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        specialization (Mapped[str]): Mentor's area of expertise
        years_of_experience (Mapped[int]): Years of professional experience
        user (Mapped[User]): Relationship to User model
    """
    __tablename__ = "mentor_profiles"

    mentor_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    user_id: Mapped[int] = mapped_column(BIGINT, ForeignKey("users.user_id"), unique=True)
    specialization: Mapped[str] = mapped_column(String(100))

    user: Mapped[User] = relationship("User", backref="mentor_profile")


class AdminProfile(Base, TimestampMixin):
    """
    Additional information specific to university admins.
    
    Attributes:
        admin_id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        access_level (Mapped[int]): Administrative access level
        administrative_role (Mapped[str]): Specific role within administration
        user (Mapped[User]): Relationship to User model
    """
    __tablename__ = "admin_profiles"

    admin_id: Mapped[int] = mapped_column(BIGINT, primary_key=True)
    user_id: Mapped[int] = mapped_column(BIGINT, ForeignKey("users.user_id"), unique=True)
    access_level: Mapped[int] = mapped_column(Integer)
    administrative_role: Mapped[str] = mapped_column(String(100))

    user: Mapped[User] = relationship("User", backref="admin_profile")
