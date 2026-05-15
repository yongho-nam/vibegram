from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class NotificationSetting(Base):
    """`/accounts/notification-settings` 토글과 1:1 매핑."""

    __tablename__ = "notification_settings"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    push_like: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_comment: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_follow: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_mention: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_direct: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_digest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utc_now, onupdate=_utc_now, nullable=False
    )


class LoginSession(Base):
    """보안 화면의 로그인 세션 목록. JWT `jti`와 연동 가능."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    jti: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, nullable=False)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, nullable=False)
