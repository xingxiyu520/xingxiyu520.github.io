from sqlalchemy import CheckConstraint, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.constants import COMMENT_STATUS_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


class Comment(IdMixin, TimestampMixin, Base):
    __tablename__ = "comments"
    __table_args__ = (
        CheckConstraint(f"status IN ({sql_values(COMMENT_STATUS_VALUES)})", name="ck_comments_status"),
    )

    article_id: Mapped[str] = mapped_column(ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    nickname: Mapped[str] = mapped_column(String(80), nullable=False)
    email_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)

    article = relationship("Article", back_populates="comments")
