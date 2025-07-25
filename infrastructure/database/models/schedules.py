from datetime import datetime, time
from enum import Enum
from typing import List, Optional

from sqlalchemy import String, BigInteger, ForeignKey, Integer, JSON, Time, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, int_pk
from .groups import Group


class ScheduleType(str, Enum):
    """
    Represents the type of schedule
    
    Values:
        ONE_TIME: One-time schedule
        WEEKLY: Weekly recurring schedule
        SPECIFIC_DATES: Schedule for specific dates
    """
    ONE_TIME = "ONE_TIME"
    WEEKLY = "WEEKLY"
    SPECIFIC_DATES = "SPECIFIC_DATES"


class Weekday(int, Enum):
    """
    Represents days of the week
    
    Values:
        MONDAY: Monday (0)
        TUESDAY: Tuesday (1)
        WEDNESDAY: Wednesday (2)
        THURSDAY: Thursday (3)
        FRIDAY: Friday (4)
        SATURDAY: Saturday (5)
        SUNDAY: Sunday (6)
    """
    MONDAY = 0
    TUESDAY = 1
    WEDNESDAY = 2
    THURSDAY = 3
    FRIDAY = 4
    SATURDAY = 5
    SUNDAY = 6


class Schedule(Base, TimestampMixin):
    """
    Represents a schedule for questionnaire assignments
    
    Attributes:
        id: Primary key
        schedule_type: Type of schedule (ONE_TIME, WEEKLY, SPECIFIC_DATES)
        
        # ONE_TIME schedule fields
        one_time_date: Date for one-time schedule
        one_time_time: Time for one-time schedule
        
        # WEEKLY schedule fields
        weekdays: List of weekdays for weekly schedule
        weekly_time: Time for weekly schedule
        
        # SPECIFIC_DATES schedule fields
        start_date: Start date for specific dates schedule
        end_date: End date for specific dates schedule (optional)
        specific_time: Time for specific dates schedule
        specific_dates: JSON array of specific dates (optional)
        
        # Common fields
        is_active: Whether the schedule is active
    """
    id: Mapped[int_pk]
    schedule_type: Mapped[str] = mapped_column(String(20))
    
    # ONE_TIME schedule fields
    one_time_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    one_time_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    
    # WEEKLY schedule fields
    weekdays: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # Comma-separated list of weekday numbers
    weekly_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    
    # SPECIFIC_DATES schedule fields
    start_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    specific_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    specific_dates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # JSON array of specific dates
    
    # Common fields
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Relationships
    groups: Mapped[List["ScheduleGroup"]] = relationship("ScheduleGroup", back_populates="schedule")


class ScheduleGroup(Base):
    """
    Represents a many-to-many relationship between schedules and groups
    
    Attributes:
        schedule_id: Reference to schedule
        group_id: Reference to group
    """
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedules.id"), primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.group_id"), primary_key=True)
    
    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="groups")
    group: Mapped["Group"] = relationship("Group")