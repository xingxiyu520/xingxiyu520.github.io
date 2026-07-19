from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Xiyu Wiki API"
    environment: str = "development"
    api_prefix: str = "/api"
    database_url: str = Field(default=f"sqlite:///{(BACKEND_DIR / 'data' / 'site.db').as_posix()}")
    jwt_secret: str = "change-me-before-production"
    jwt_expire_days: int = 7
    admin_cookie_name: str = "xiyu_admin_token"
    initial_admin_username: str = "admin"
    initial_admin_password: str = "change-me-on-first-login"
    upload_dir: str = "./uploads"
    public_upload_base_url: str = "/uploads"
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("api_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        return value if value.startswith("/") else f"/{value}"

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        return path if path.is_absolute() else BACKEND_DIR / path

    @property
    def sqlite_path(self) -> Path | None:
        prefix = "sqlite:///"
        if not self.database_url.startswith(prefix):
            return None

        raw_path = self.database_url.removeprefix(prefix)
        path = Path(raw_path)
        return path if path.is_absolute() else BACKEND_DIR / path

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def admin_cookie_secure(self) -> bool:
        return self.is_production

    def validate_runtime_security(self) -> None:
        if not self.is_production:
            return

        weak_secrets = {"change-me-before-production", "replace-with-a-long-random-secret"}
        if self.jwt_secret in weak_secrets or len(self.jwt_secret) < 32:
            raise ValueError("Production JWT_SECRET must be a random string of at least 32 characters")

        if self.initial_admin_password in {"change-me-on-first-login", "replace-before-first-run"}:
            raise ValueError("Production INITIAL_ADMIN_PASSWORD must be changed before first run")


@lru_cache
def get_settings() -> Settings:
    return Settings()


def ensure_runtime_dirs(settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()

    active_settings.upload_path.mkdir(parents=True, exist_ok=True)

    sqlite_path = active_settings.sqlite_path
    if sqlite_path is not None:
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
