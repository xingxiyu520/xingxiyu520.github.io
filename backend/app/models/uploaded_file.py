from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.constants import FILE_OWNER_TYPE_VALUES, sql_values
from app.models.mixins import IdMixin, TimestampMixin


class UploadedFile(IdMixin, TimestampMixin, Base):
    __tablename__ = "uploaded_files"
    __table_args__ = (
        CheckConstraint(f"owner_type IN ({sql_values(FILE_OWNER_TYPE_VALUES)})", name="ck_uploaded_files_owner_type"),
    )

    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    owner_type: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    owner_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
