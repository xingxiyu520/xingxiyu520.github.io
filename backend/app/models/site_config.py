from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin


class SiteConfig(IdMixin, TimestampMixin, Base):
    __tablename__ = "site_config"

    key: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    value_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
