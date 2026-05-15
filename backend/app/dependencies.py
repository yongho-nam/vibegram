from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_database(db: Session = Depends(get_db)) -> Session:
    return db


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    if not creds or creds.scheme.lower() != "bearer":
        return None
    try:
        payload = decode_token(creds.credentials)
        uid = int(payload["sub"])
    except (InvalidTokenError, ValueError, KeyError):
        return None
    return db.get(User, uid)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not creds or creds.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(creds.credentials)
        uid = int(payload["sub"])
    except (InvalidTokenError, ValueError, KeyError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin only")
    return user


def get_token_jti(creds: HTTPAuthorizationCredentials | None = Depends(security)) -> str | None:
    if not creds or creds.scheme.lower() != "bearer":
        return None
    try:
        payload = decode_token(creds.credentials)
        return str(payload.get("jti") or "")
    except (InvalidTokenError, ValueError, KeyError):
        return None
