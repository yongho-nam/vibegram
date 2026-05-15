from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import bcrypt
import hashlib
import hmac
import jwt

from app.config import settings


def hash_password_reset_token(raw_token: str) -> str:
    return hmac.new(
        settings.jwt_secret.encode("utf-8"),
        raw_token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        return False


def create_access_token(*, user_id: int, jti: str | None = None) -> tuple[str, str]:
    """Returns (token, jti)."""
    tid = jti or uuid4().hex[:32]
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.jwt_expires_minutes)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "jti": tid,
        "iat": int(now.timestamp()),
        "exp": exp,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, tid


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
