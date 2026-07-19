from sqlalchemy import CheckConstraint, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.constants import CATEGORY_TYPE_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


class Category(IdMixin, TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("name", "type", name="uq_categories_name_type"),
        CheckConstraint(f"type IN ({sql_values(CATEGORY_TYPE_VALUES)})", name="ck_categories_type"),
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    articles = relationship("Article", back_populates="category")
    shares = relationship("Share", back_populates="category")


class Tag(IdMixin, TimestampMixin, Base):
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("name", "type", name="uq_tags_name_type"),
        CheckConstraint(f"type IN ({sql_values(CATEGORY_TYPE_VALUES)})", name="ck_tags_type"),
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    articles = relationship("Article", secondary="article_tags", back_populates="tags")
    shares = relationship("Share", secondary="share_tags", back_populates="tags")
