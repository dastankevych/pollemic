from datetime import datetime
from typing import List

from sqlalchemy import BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

        start_time: Start time of the assignment
        deadline_time: Deadline time of the assignment
        
        created_by: User who created the assignment
    """
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"))
    group_id: Mapped[List[int]] = mapped_column(ForeignKey("groups.id"))

    # Schedule 
    start_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    deadline_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    
    created_by: Mapped[int] = mapped_column(ForeignKey("users.user_id"))

    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire")
    target_group: Mapped["Group"] = relationship("Group")
    schedule: Mapped["Schedule"] = relationship("Schedule")
    creator: Mapped["User"] = relationship("User")