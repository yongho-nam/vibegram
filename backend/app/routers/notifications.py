from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.serializers import serialize_notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[dict])
def list_notifications(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    rows = (
        db.execute(select(Notification).where(Notification.recipient_id == me.id).order_by(Notification.created_at.desc()).limit(200))
        .scalars()
        .all()
    )
    return [serialize_notification(db, n) for n in rows]


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def read_all(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.execute(update(Notification).where(Notification.recipient_id == me.id).values(is_read=True))
    db.commit()


@router.patch("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def read_one(notification_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    n = db.get(Notification, notification_id)
    if not n or n.recipient_id != me.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    n.is_read = True
    db.commit()
