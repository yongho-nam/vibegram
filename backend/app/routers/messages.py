from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.message import Message, MessageThread, ThreadParticipant
from app.models.user import User
from app.serializers import _avatar_url
from app.services.notify import blocked_pair
from app.utils.timefmt import time_ago_ko

router = APIRouter(prefix="/messages", tags=["messages"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _find_dm_thread(db: Session, a: int, b: int) -> MessageThread | None:
    tids = [r[0] for r in db.execute(select(ThreadParticipant.thread_id).where(ThreadParticipant.user_id == a)).all()]
    for tid in tids:
        uids = {r[0] for r in db.execute(select(ThreadParticipant.user_id).where(ThreadParticipant.thread_id == tid)).all()}
        if uids == {a, b}:
            return db.get(MessageThread, tid)
    return None


class ThreadPreviewOut(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str
    lastMessage: str
    timeLabel: str
    unread: bool


@router.get("/threads", response_model=list[ThreadPreviewOut])
def list_threads(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ThreadPreviewOut]:
    tids = [r[0] for r in db.execute(select(ThreadParticipant.thread_id).where(ThreadParticipant.user_id == me.id)).all()]
    buf: list[tuple[datetime, ThreadPreviewOut]] = []
    for tid in tids:
        t = db.get(MessageThread, tid)
        if not t:
            continue
        other_uid = None
        for r in db.execute(select(ThreadParticipant.user_id).where(ThreadParticipant.thread_id == tid)).all():
            if r[0] != me.id:
                other_uid = r[0]
                break
        if other_uid is None:
            continue
        other = db.get(User, other_uid)
        if not other:
            continue
        last = db.execute(
            select(Message).where(Message.thread_id == tid).order_by(Message.created_at.desc()).limit(1)
        ).scalar_one_or_none()
        last_body = (last.body or "").strip() if last else ""
        tp = db.execute(
            select(ThreadParticipant).where(ThreadParticipant.thread_id == tid, ThreadParticipant.user_id == me.id)
        ).scalar_one_or_none()
        last_read = tp.last_read_at if tp else None
        unread = False
        if last and last.sender_id != me.id:
            if last_read is None or last.created_at > last_read:
                unread = True
        sort_dt = last.created_at if last else datetime(1970, 1, 1, tzinfo=timezone.utc)
        buf.append(
            (
                sort_dt,
                ThreadPreviewOut(
                    id=str(tid),
                    username=other.username,
                    displayName=other.display_name or other.username,
                    avatarUrl=_avatar_url(other),
                    lastMessage=last_body[:200],
                    timeLabel=time_ago_ko(last.created_at) if last else "",
                    unread=unread,
                ),
            )
        )
    buf.sort(key=lambda x: x[0], reverse=True)
    return [x[1] for x in buf]


class ThreadCreateIn(BaseModel):
    other_user_id: int = Field(..., ge=1)


@router.post("/threads", response_model=ThreadPreviewOut, status_code=status.HTTP_201_CREATED)
def create_or_get_thread(body: ThreadCreateIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ThreadPreviewOut:
    if body.other_user_id == me.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid")
    other = db.get(User, body.other_user_id)
    if not other:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if blocked_pair(db, me.id, other.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Blocked")
    existing = _find_dm_thread(db, me.id, other.id)
    if existing:
        tid = existing.id
    else:
        mt = MessageThread()
        db.add(mt)
        db.flush()
        db.add(ThreadParticipant(thread_id=mt.id, user_id=me.id))
        db.add(ThreadParticipant(thread_id=mt.id, user_id=other.id))
        tid = mt.id
        db.commit()
    return ThreadPreviewOut(
        id=str(tid),
        username=other.username,
        displayName=other.display_name or other.username,
        avatarUrl=_avatar_url(other),
        lastMessage="",
        timeLabel="",
        unread=False,
    )


class MessageOut(BaseModel):
    id: str
    fromMe: bool
    body: str
    time: str


class MessagesPage(BaseModel):
    items: list[MessageOut]
    next_cursor: str | None = None


@router.get("/threads/{thread_id}/messages", response_model=MessagesPage)
def list_messages(
    thread_id: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
) -> MessagesPage:
    tp = db.execute(
        select(ThreadParticipant).where(ThreadParticipant.thread_id == thread_id, ThreadParticipant.user_id == me.id)
    ).scalar_one_or_none()
    if not tp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")
    limit = min(max(limit, 1), 100)
    rows = (
        db.execute(select(Message).where(Message.thread_id == thread_id).order_by(Message.created_at.asc()).limit(limit))
        .scalars()
        .all()
    )
    items = [
        MessageOut(
            id=str(m.id),
            fromMe=m.sender_id == me.id,
            body=(m.body or "").strip(),
            time=m.created_at.isoformat(),
        )
        for m in rows
    ]
    return MessagesPage(items=items, next_cursor=None)


class MessageIn(BaseModel):
    body: str = Field(..., min_length=1, max_length=8000)


@router.post("/threads/{thread_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    thread_id: int,
    body: MessageIn,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    tp = db.execute(
        select(ThreadParticipant).where(ThreadParticipant.thread_id == thread_id, ThreadParticipant.user_id == me.id)
    ).scalar_one_or_none()
    if not tp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")
    other_ids = [
        r[0]
        for r in db.execute(select(ThreadParticipant.user_id).where(ThreadParticipant.thread_id == thread_id)).all()
        if r[0] != me.id
    ]
    for oid in other_ids:
        if blocked_pair(db, me.id, oid):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Blocked")
    m = Message(thread_id=thread_id, sender_id=me.id, body=body.body.strip())
    db.add(m)
    mt = db.get(MessageThread, thread_id)
    if mt:
        mt.updated_at = _now()
    db.commit()
    db.refresh(m)
    return MessageOut(id=str(m.id), fromMe=True, body=m.body or "", time=m.created_at.isoformat())


@router.patch("/threads/{thread_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(thread_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    tp = db.execute(
        select(ThreadParticipant).where(ThreadParticipant.thread_id == thread_id, ThreadParticipant.user_id == me.id)
    ).scalar_one_or_none()
    if not tp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Thread not found")
    tp.last_read_at = _now()
    db.commit()
