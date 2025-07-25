from datetime import datetime
from typing import List, Optional

from sqlalchemy import BigInteger, ForeignKey, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from sqlalchemy.dialects.postgresql import TIMESTAMP

from .base import Base, TimestampMixin
from .questionnaires import Questionnaire
from .groups import Group
from .schedules import Schedule
from .users import User

class Assignment(Base, TimestampMixin):
    """
    Represents assignment of a questionnaire to a group
    
    Attributes:
        id: Primary key
        questionnaire_id: Reference to questionnaire
        group_id: Reference to group
        schedule_id: Reference to schedule (optional)

        start_time: Start time of the assignment
        deadline_time: Deadline time of the assignment
        
        created_by: User who created the assignment
    """
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.group_id"))
    schedule_id: Mapped[Optional[int]] = mapped_column(ForeignKey("schedules.id"), nullable=True)

    # Schedule 
    start_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    deadline_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"))

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire")
    target_group: Mapped["Group"] = relationship("Group")
    schedule: Mapped[Optional["Schedule"]] = relationship(
        "Schedule",
        primaryjoin="Assignment.schedule_id == Schedule.id",
        foreign_keys=[schedule_id]
    )
    creator: Mapped["User"] = relationship("User")