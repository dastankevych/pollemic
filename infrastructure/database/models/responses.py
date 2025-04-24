from sqlalchemy import ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .users import User
from .assignments import Assignment

class Response(Base, TimestampMixin):
    """
    Represents a student's response to a questionnaire
    
    Attributes:
        id: Primary keyr
        assignment_id: Reference to questionnaire assignment
        student_id: Reference to student who responded
        answers: JSON field containing answers
        is_completed: Whether the response is complete
    """
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    answers: Mapped[dict] = mapped_column(JSON)
    is_completed: Mapped[bool] = mapped_column(default=False)

    assignment: Mapped["Assignment"] = relationship("Assignment")
    student: Mapped[User] = relationship("User")