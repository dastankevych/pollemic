from sqlalchemy import String, BigInteger
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin

class Group(Base, TimestampMixin):
    """
    Represents a Telegram group or channel
    
    Attributes:
        id: Telegram group/channel ID
        title: Group/channel title
        type: Type of chat (group/supergroup/channel)
        is_active: Whether the group is active
    """
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(default=True)
