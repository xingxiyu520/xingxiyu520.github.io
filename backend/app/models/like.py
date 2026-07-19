from sqlalchemy import CheckConstraint, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin


class Like(IdMixin, TimestampMixin, Base):
    __tablename__ = "likes"
    __table_args__ = (
        CheckConstraint("target_type IN ('site', 'article')", name="ck_likes_target_type"),
        UniqueConstraint("target_type", "target_id", "client_hash", name="uq_likes_target_client"),
        Index("ix_likes_target", "target_type", "target_id"),
    )

    target_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    target_id: Mapped[str] = mapped_column(String(80), nullable=False)
    client_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
