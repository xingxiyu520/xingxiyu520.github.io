from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin, utc_now


class ArticleView(IdMixin, TimestampMixin, Base):
    __tablename__ = "article_views"
    __table_args__ = (
        Index("ix_article_views_article_ip_time", "article_id", "ip_hash", "viewed_at"),
    )

    article_id: Mapped[str] = mapped_column(ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    article = relationship("Article", back_populates="views")
