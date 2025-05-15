from sqlalchemy import ForeignKey, Integer, JSON, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from .base import Base, TimestampMixin

class Response(Base, TimestampMixin):
    """
    Represents a student's response to a questionnaire.
    
    Attributes:
        id: Primary key
        assignment_id: Reference to questionnaire assignment
        student_id: Reference to student who responded
        answers: JSON field containing answers
        is_completed: Whether the response is complete
        submitted_at: Timestamp of when the response was submitted
    """
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    answers: Mapped[dict] = mapped_column(JSON)
    is_completed: Mapped[bool] = mapped_column(default=False)
    submitted_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)

    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="responses")
    student: Mapped["User"] = relationship("User")