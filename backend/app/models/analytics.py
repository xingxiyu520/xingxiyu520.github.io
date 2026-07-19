from datetime import datetime

from sqlalchemy import DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin, utc_now


class AnalyticsEvent(IdMixin, TimestampMixin, Base):
    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_events_type_time", "event_type", "occurred_at"),
        Index("ix_analytics_events_target", "target_type", "target_id"),
    )

    event_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    target_type: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    target_id: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    target_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    path: Mapped[str] = mapped_column(String(500), default="/", nullable=False)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    client_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    ip_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
