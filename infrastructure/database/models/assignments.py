from datetime import datetime
from typing import List

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import Optional

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
        updated_at: Last updated timestamp

        questionnaire: Relationship to the questionnaire
        target_group: Relationship to the target group
        creator: Relationship to the creator user
        responses: Relationship to responses
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id"))
    name: Mapped[str] = mapped_column(String(255))

    # Schedule
    start_time: Mapped[datetime] = mapped_column(TIMESTAMP)
    deadline_time: Mapped[datetime] = mapped_column(TIMESTAMP)

    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))

    updated_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, onupdate=datetime.now)

    # Relationships
    questionnaire: Mapped["Questionnaire"] = relationship("Questionnaire", back_populates="assignments")
    target_group: Mapped["Group"] = relationship("Group", back_populates="assignments")
    creator: Mapped["User"] = relationship("User")
    responses: Mapped[List["Response"]] = relationship(
        "Response", back_populates="assignment", cascade="all, delete-orphan"
    )

    def is_active(self) -> bool:
        """Check if the assignment is currently active"""
        now = datetime.now()
        return self.start_time <= now <= self.deadline_time

    def get_status(self) -> str:
        """Get the current status of the assignment (upcoming, active, completed)"""
        now = datetime.now()
        if now < self.start_time:
            return "upcoming"
        elif now > self.deadline_time:
            return "completed"
        else:
            return "active"