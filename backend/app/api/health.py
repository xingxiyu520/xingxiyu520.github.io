from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, object]:
    db.execute(text("SELECT 1"))
    settings = get_settings()

    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
        "database": "ok",
    }
