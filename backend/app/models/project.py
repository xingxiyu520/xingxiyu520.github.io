from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.constants import CONTENT_STATUS_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


class Project(IdMixin, TimestampMixin, Base):
    __tablename__ = "projects"
    __table_args__ = (
        CheckConstraint(f"status IN ({sql_values(CONTENT_STATUS_VALUES)})", name="ck_projects_status"),
    )

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_markdown: Mapped[str] = mapped_column(Text, default="", nullable=False)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tech_stack: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    demo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
