from sqlalchemy import String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

class Group(Base, TimestampMixin):
    """
    Represents a Telegram group or channel
    
    Attributes:
        id: Telegram group/channel ID
        title: Group/channel title
        is_active: Whether the group is active
    """
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    tag: Mapped[str] = mapped_column(String(255))

    # Relationships
    assignments: Mapped[list["Assignment"]] = relationship(
        "Assignment", back_populates="target_group", cascade="all, delete-orphan"
    )