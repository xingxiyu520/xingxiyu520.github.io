from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.admin import Admin
from app.services.admin_auth import get_admin_by_id
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login", auto_error=False)


def get_current_admin(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> Admin:
    settings = get_settings()
    active_token = token or request.cookies.get(settings.admin_cookie_name)
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录状态已失效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not active_token:
        raise credentials_error

    try:
        payload = decode_access_token(active_token, settings.jwt_secret)
        admin_id = payload.get("sub")
        if not isinstance(admin_id, str) or not admin_id:
            raise credentials_error
    except JWTError as exc:
        raise credentials_error from exc

    admin = get_admin_by_id(db, admin_id)
    if admin is None:
        raise credentials_error

    return admin


def get_password_ready_admin(
    current_admin: Annotated[Admin, Depends(get_current_admin)],
) -> Admin:
    if current_admin.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="首次登录需要先修改密码",
        )

    return current_admin
