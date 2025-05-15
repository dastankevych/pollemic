from sqlalchemy import String, BigInteger, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from .base import Base, TimestampMixin


class Group(Base, TimestampMixin):
    """
    Represents a Telegram group or channel

    Attributes:
        id: Telegram group/channel ID
        title: Group/channel title
        is_active: Whether the group is active
        tag: Tag for categorizing the group
        tags: Additional tags for more complex categorization

        assignments: Relationship to assignments targeting this group
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    tag: Mapped[str] = mapped_column(String(255), nullable=True)
    tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)

    # Relationships
    assignments: Mapped[List["Assignment"]] = relationship(
        "Assignment", back_populates="target_group", cascade="all, delete-orphan"
    )