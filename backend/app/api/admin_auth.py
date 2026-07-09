from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.config import get_settings
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.auth import AdminLoginRequest, AdminProfile, AdminTokenResponse, ChangePasswordRequest, ChangePasswordResponse
from app.services.admin_auth import authenticate_admin, change_admin_password
from app.utils.rate_limit import (
    build_login_key,
    clear_login_failures,
    get_login_retry_after_seconds,
    record_login_failure,
)
from app.utils.security import create_access_token

router = APIRouter(prefix="/admin", tags=["admin-auth"])


@router.post("/login", response_model=AdminTokenResponse)
def login(
    payload: AdminLoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> AdminTokenResponse:
    client_host = request.client.host if request.client else None
    login_key = build_login_key(payload.username, client_host)
    retry_after = get_login_retry_after_seconds(login_key)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="登录失败次数过多，请稍后再试",
            headers={"Retry-After": str(retry_after)},
        )

    admin = authenticate_admin(db, payload.username, payload.password)
    if admin is None:
        record_login_failure(login_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )

    clear_login_failures(login_key)

    settings = get_settings()
    expires_delta = timedelta(days=settings.jwt_expire_days)
    access_token = create_access_token(
        subject=admin.id,
        secret=settings.jwt_secret,
        expires_delta=expires_delta,
        extra_claims={"username": admin.username},
    )

    return AdminTokenResponse(
        access_token=access_token,
        expires_in_seconds=int(expires_delta.total_seconds()),
        must_change_password=admin.must_change_password,
        admin=AdminProfile.model_validate(admin),
    )


@router.get("/me", response_model=AdminProfile)
def read_current_admin(current_admin: Annotated[Admin, Depends(get_current_admin)]) -> Admin:
    return current_admin


@router.post("/logout")
def logout(current_admin: Annotated[Admin, Depends(get_current_admin)]) -> dict[str, str]:
    return {"status": "ok"}


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    payload: ChangePasswordRequest,
    current_admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
) -> ChangePasswordResponse:
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能和当前密码相同",
        )

    admin = change_admin_password(db, current_admin, payload.current_password, payload.new_password)
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码不正确",
        )

    return ChangePasswordResponse(status="ok", admin=AdminProfile.model_validate(admin))
