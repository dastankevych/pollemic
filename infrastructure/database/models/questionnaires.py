from sqlalchemy import String, ForeignKey, Integer, JSON, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .users import User

class Questionnaire(Base, TimestampMixin):
    """
    Represents a questionnaire template
    
    Attributes:
        id: Primary key
        title: Questionnaire title
        description: Questionnaire description
        questions: JSON field containing questions structure
        created_by: ID of admin who created the questionnaire
        is_anonymous: Whether responses should be anonymous
        schedules: Schedules for this questionnaire
    """
    __tablename__ = "questionnaires"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    questions: Mapped[dict] = mapped_column(JSON)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    is_anonymous: Mapped[bool] = mapped_column(default=False)

    creator: Mapped["User"] = relationship("User")