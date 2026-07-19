from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.constants import CONTENT_STATUS_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


class FriendLink(IdMixin, TimestampMixin, Base):
    __tablename__ = "friend_links"
    __table_args__ = (
        CheckConstraint(f"status IN ({sql_values(CONTENT_STATUS_VALUES)})", name="ck_friend_links_status"),
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
