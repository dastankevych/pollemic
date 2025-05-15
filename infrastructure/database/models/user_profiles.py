from sqlalchemy import ForeignKey, BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

class StudentProfile(Base, TimestampMixin):
    """
    Additional information specific to students.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    
    user: Mapped["User"] = relationship("User", backref="student_profile")


class MentorProfile(Base, TimestampMixin):
    """
    Additional information specific to mentors.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        user (Mapped[User]): Relationship to User model
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=True)
    
    user: Mapped["User"] = relationship("User", backref="mentor_profile")


class AdminProfile(Base, TimestampMixin):
    """
    Additional information specific to university admins.
    
    Attributes:
        id (Mapped[int]): Primary key
        user_id (Mapped[int]): Foreign key to User table
        access_level (Mapped[int]): Administrative access level
        user (Mapped[User]): Relationship to User model
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), unique=True)

    user: Mapped["User"] = relationship("User", backref="admin_profile")
