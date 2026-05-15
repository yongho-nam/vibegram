"""데모용 관리자 계정(admin / 12345)을 보장합니다. 운영 환경에서는 비밀번호·권한을 별도로 관리하세요."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.account_extras import NotificationSetting
from app.models.user import User

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "12345"
ADMIN_EMAIL = "admin@localhost"


def ensure_demo_admin(db: Session) -> None:
    u = db.execute(select(User).where(User.username == ADMIN_USERNAME)).scalar_one_or_none()
    if u is None:
        u = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            display_name="Administrator",
            is_admin=True,
        )
        db.add(u)
        db.flush()
        if db.get(NotificationSetting, u.id) is None:
            db.add(NotificationSetting(user_id=u.id))
        db.commit()
        return

    if not u.is_admin:
        u.is_admin = True
        db.commit()
