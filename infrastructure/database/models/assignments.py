from datetime import datetime
from typing import List

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from sqlalchemy.dialects.postgresql import TIMESTAMP

from .base import Base, TimestampMixin

class Assignment(Base, TimestampMixin):
    """
    Represents assignment of a questionnaire to a group.
    
    Attributes:
        id: Primary key
        questionnaire_id: Reference to questionnaire
        group_id: Reference to group
        name: Name of the assignment (e.g., "Start of Semester", "End of Semester")
        start_time: Start time of the assignment
        deadline_time: Deadline time of the assignment
        created_by: User who created the assignment
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    name: Mapped[str] = mapped_column(String(255), nullable=True)

    #Schedule
    start_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    deadline_time: Mapped[datetime] = mapped_column(TIMESTAMP)

    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="assignments")
    target_group: Mapped["Group"] = relationship("Group", back_populates="groups")
    creator: Mapped["User"] = relationship("User")