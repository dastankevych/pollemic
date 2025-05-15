from sqlalchemy import String, ForeignKey, Integer, JSON, BigInteger, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from .base import Base, TimestampMixin


class Questionnaire(Base, TimestampMixin):
    """
    Represents a questionnaire template

    Attributes:
        id: Primary key
        title: Questionnaire title
        description: Questionnaire description
        questions: JSON field containing questions structure
        created_by: ID of admin who created the questionnaire
        tags: Array of tags for categorization
        status: Current status (draft, active, completed, archived)
        assignments: Relationship to assignments
    """
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    questions: Mapped[List[dict]] = mapped_column(JSON)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, active, completed, archived

    # Relationships
    creator: Mapped["User"] = relationship("User")
    assignments: Mapped[List["Assignment"]] = relationship(
        "Assignment", back_populates="questionnaire", cascade="all, delete-orphan"
    )
