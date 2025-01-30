from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, ForeignKey, Integer, JSON, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .users import User


class Group(Base, TimestampMixin):
    """
    Represents a Telegram group/channel where questionnaires are distributed
    
    Attributes:
        group_id: Telegram chat ID
        title: Group/channel name
        is_active: Whether the group is active
        assigned_questionnaires: Relationship to assigned questionnaires
    """
    __tablename__ = "groups"

    group_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)


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
    """
    __tablename__ = "questionnaires"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    questions: Mapped[dict] = mapped_column(JSON)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.user_id"))
    is_anonymous: Mapped[bool] = mapped_column(default=False)

    creator: Mapped[User] = relationship("User")


class QuestionnaireAssignment(Base, TimestampMixin):
    """
    Represents assignment of questionnaire to a group
    
    Attributes:
        id: Primary key
        questionnaire_id: Reference to questionnaire
        group_id: Reference to group
        due_date: Deadline for responses
        is_active: Whether the assignment is active
    """
    __tablename__ = "questionnaire_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.group_id"))
    due_date: Mapped[datetime]
    is_active: Mapped[bool] = mapped_column(default=True)

    questionnaire: Mapped[Questionnaire] = relationship("Questionnaire")
    group: Mapped[Group] = relationship("Group")


class QuestionnaireResponse(Base, TimestampMixin):
    """
    Represents a student's response to a questionnaire
    
    Attributes:
        id: Primary key
        assignment_id: Reference to questionnaire assignment
        student_id: Reference to student who responded
        answers: JSON field containing answers
        is_completed: Whether the response is complete
    """
    __tablename__ = "questionnaire_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("questionnaire_assignments.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    answers: Mapped[dict] = mapped_column(JSON)
    is_completed: Mapped[bool] = mapped_column(default=False)

    assignment: Mapped[QuestionnaireAssignment] = relationship("QuestionnaireAssignment")
    student: Mapped[User] = relationship("User") 