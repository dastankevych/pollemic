from sqlalchemy import String, ForeignKey, SmallInteger, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .users import User


class StudentProfile(Base, TimestampMixin):
    """
    Additional information specific to students.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
    """
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), unique=True)

    user: Mapped[User] = relationship("User", backref="student_profile")

class MentorProfile(Base, TimestampMixin):
    """
    Additional information specific to mentors.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        user (Mapped[User]): Relationship to User model
    """
    __tablename__ = "mentor_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), unique=True)

    user: Mapped[User] = relationship("User", backref="mentor_profile")

class AdminProfile(Base, TimestampMixin):
    """
    Additional information specific to university admins.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        access_level (Mapped[int]): Administrative access level
        user (Mapped[User]): Relationship to User model
    """
    __tablename__ = "admin_profiles"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"), unique=True)

    user: Mapped[User] = relationship("User", backref="admin_profile")
