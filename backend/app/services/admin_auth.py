from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.admin import Admin
from app.utils.security import hash_password, verify_password


def get_admin_by_id(db: Session, admin_id: str) -> Admin | None:
    return db.get(Admin, admin_id)


def get_admin_by_username(db: Session, username: str) -> Admin | None:
    statement = select(Admin).where(Admin.username == username.strip())
    return db.scalar(statement)


def ensure_initial_admin(db: Session) -> Admin | None:
    existing_admin_id = db.scalar(select(Admin.id).limit(1))
    if existing_admin_id is not None:
        return None

    settings = get_settings()
    admin = Admin(
        username=settings.initial_admin_username.strip(),
        password_hash=hash_password(settings.initial_admin_password),
        must_change_password=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def authenticate_admin(db: Session, username: str, password: str) -> Admin | None:
    admin = get_admin_by_username(db, username)
    if admin is None:
        return None

    if not verify_password(password, admin.password_hash):
        return None

    admin.last_login_at = datetime.now(timezone.utc)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def change_admin_password(db: Session, admin: Admin, current_password: str, new_password: str) -> Admin | None:
    if not verify_password(current_password, admin.password_hash):
        return None

    admin.password_hash = hash_password(new_password)
    admin.must_change_password = False
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
