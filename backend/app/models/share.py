from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.constants import CONTENT_STATUS_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


share_tags = Table(
    "share_tags",
    Base.metadata,
    Column("share_id", String(36), ForeignKey("shares.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Share(IdMixin, TimestampMixin, Base):
    __tablename__ = "shares"
    __table_args__ = (
        CheckConstraint(f"status IN ({sql_values(CONTENT_STATUS_VALUES)})", name="ck_shares_status"),
    )

    title: Mapped[str] = mapped_column(String(180), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    external_url: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    category = relationship("Category", back_populates="shares")
    tags = relationship("Tag", secondary=share_tags, back_populates="shares")
