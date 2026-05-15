from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    hash_password_reset_token,
    verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.models.account_extras import LoginSession, NotificationSetting
from app.models.password_reset import PasswordResetToken
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterIn(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=30)
    password: str = Field(min_length=3, max_length=128)
    display_name: str | None = Field(None, max_length=100)


class LoginIn(BaseModel):
    login: str = Field(..., description="email or username")
    password: str


_FORGOT_RESPONSE_MSG = "요청을 처리했습니다. 계정이 등록되어 있다면 비밀번호를 재설정할 수 있습니다."


class ForgotPasswordIn(BaseModel):
    login: str = Field(..., min_length=1, max_length=255, description="email or username")


class ForgotPasswordOut(BaseModel):
    message: str
    reset_url: str | None = None


class ResetPasswordIn(BaseModel):
    token: str = Field(..., min_length=8, max_length=512)
    new_password: str = Field(..., min_length=3, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBrief(BaseModel):
    id: str
    username: str
    email: str | None = None
    displayName: str
    avatarUrl: str
    bio: str | None = None
    isAdmin: bool = False


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserBrief


def _brief(u: User) -> UserBrief:
    from app.serializers import _avatar_url

    return UserBrief(
        id=str(u.id),
        username=u.username,
        email=u.email,
        displayName=u.display_name or u.username,
        avatarUrl=_avatar_url(u),
        bio=u.bio,
        isAdmin=bool(u.is_admin),
    )


def _ensure_notif_settings(db: Session, user_id: int) -> None:
    if db.get(NotificationSetting, user_id):
        return
    db.add(NotificationSetting(user_id=user_id))


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> AuthResponse:
    email_l = body.email.lower().strip()
    un = body.username.strip()
    if un.lower() == "admin":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reserved username")
    if db.execute(select(User).where(User.email == email_l)).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    if db.execute(select(User).where(User.username == un)).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username taken")
    u = User(
        email=email_l,
        username=un,
        password_hash=hash_password(body.password),
        display_name=body.display_name or un,
    )
    db.add(u)
    db.flush()
    _ensure_notif_settings(db, u.id)
    token, jti = create_access_token(user_id=u.id)
    db.execute(update(LoginSession).where(LoginSession.user_id == u.id).values(is_current=False))
    db.add(
        LoginSession(
            user_id=u.id,
            jti=jti,
            user_agent=None,
            ip_hash=None,
            is_current=True,
        )
    )
    db.commit()
    db.refresh(u)
    return AuthResponse(access_token=token, user=_brief(u))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginIn, db: Session = Depends(get_db)) -> AuthResponse:
    lid = body.login.strip().lower()
    u = db.execute(select(User).where(User.email == lid)).scalar_one_or_none()
    if not u:
        u = db.execute(select(User).where(User.username == body.login.strip())).scalar_one_or_none()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token, jti = create_access_token(user_id=u.id)
    db.execute(update(LoginSession).where(LoginSession.user_id == u.id).values(is_current=False))
    db.add(
        LoginSession(
            user_id=u.id,
            jti=jti,
            user_agent=None,
            ip_hash=None,
            is_current=True,
        )
    )
    db.commit()
    return AuthResponse(access_token=token, user=_brief(u))


@router.post("/forgot-password", response_model=ForgotPasswordOut)
def forgot_password(body: ForgotPasswordIn, db: Session = Depends(get_db)) -> ForgotPasswordOut:
    lid = body.login.strip()
    if not lid:
        return ForgotPasswordOut(message=_FORGOT_RESPONSE_MSG)
    email_lookup = lid.lower()
    u = db.execute(select(User).where(User.email == email_lookup)).scalar_one_or_none()
    if not u:
        u = db.execute(select(User).where(User.username == lid)).scalar_one_or_none()
    if not u:
        return ForgotPasswordOut(message=_FORGOT_RESPONSE_MSG)

    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == u.id))
    raw = secrets.token_urlsafe(32)
    token_hash = hash_password_reset_token(raw)
    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    db.add(PasswordResetToken(user_id=u.id, token_hash=token_hash, expires_at=exp))
    db.commit()

    reset_url: str | None = None
    if settings.expose_password_reset_link:
        base = settings.frontend_origin.rstrip("/")
        reset_url = f"{base}/reset-password?token={raw}"

    detail = (
        "아래 링크로 이동해 새 비밀번호를 설정하세요. (데모: 이메일 발송 없이 링크만 제공됩니다.)"
        if reset_url
        else "등록된 이메일로 안내를 보냈습니다. (운영 환경에서는 메일 발송을 연동하세요.)"
    )
    return ForgotPasswordOut(message=f"{_FORGOT_RESPONSE_MSG} {detail}", reset_url=reset_url)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(body: ResetPasswordIn, db: Session = Depends(get_db)) -> None:
    raw = body.token.strip()
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    token_hash = hash_password_reset_token(raw)
    row = db.execute(select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if not row or row.used_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    exp = row.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    u = db.get(User, row.user_id)
    if not u:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset link")
    u.password_hash = hash_password(body.new_password)
    row.used_at = now
    db.commit()


@router.get("/me", response_model=UserBrief)
def auth_me(me: User = Depends(get_current_user)) -> UserBrief:
    return _brief(me)
