from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.story import Story, StoryView
from app.models.user import User
from app.serializers import _avatar_url
from app.services.media_files import public_media_url, save_bytes
from app.services.notify import blocked_pair

router = APIRouter(prefix="/stories", tags=["stories"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


class StoryUserOut(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str
    hasUnseen: bool
    isOwn: bool | None = None


@router.get("/feed", response_model=list[StoryUserOut])
def stories_feed(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> list[StoryUserOut]:
    now = _now()
    sub = (
        select(Story.author_id)
        .where(Story.expires_at > now, Story.is_archived.is_(False))
        .group_by(Story.author_id)
    )
    author_ids = [r[0] for r in db.execute(sub).all()]
    out: list[StoryUserOut] = []
    for aid in author_ids:
        u = db.get(User, aid)
        if not u:
            continue
        if viewer and blocked_pair(db, viewer.id, u.id):
            continue
        if u.is_private and (not viewer or (viewer.id != u.id and not _is_follower(db, viewer.id, u))):
            continue
        stories = (
            db.execute(
                select(Story)
                .where(Story.author_id == aid, Story.expires_at > now, Story.is_archived.is_(False))
                .order_by(Story.created_at.desc())
            )
            .scalars()
            .all()
        )
        if not stories:
            continue
        if not viewer:
            has_unseen = True
        else:
            has_unseen = any(
                db.execute(select(StoryView).where(StoryView.story_id == s.id, StoryView.viewer_id == viewer.id)).first()
                is None
                for s in stories
            )
        is_own = bool(viewer and viewer.id == u.id)
        out.append(
            StoryUserOut(
                id=str(u.id),
                username=u.username,
                displayName=u.display_name or u.username,
                avatarUrl=_avatar_url(u),
                hasUnseen=has_unseen,
                isOwn=is_own,
            )
        )
    return out


def _is_follower(db: Session, follower_id: int, author: User) -> bool:
    from app.models.follow import Follow

    if follower_id == author.id:
        return True
    return (
        db.execute(select(Follow).where(Follow.follower_id == follower_id, Follow.followee_id == author.id)).first()
        is not None
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_story(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
) -> dict:
    data = await file.read()
    if len(data) > 15_000_000:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large")
    ext = ".jpg"
    if file.content_type and "png" in file.content_type:
        ext = ".png"
    elif file.content_type and "webp" in file.content_type:
        ext = ".webp"
    rel = save_bytes("stories", data, ext)
    exp = _now() + timedelta(hours=24)
    s = Story(author_id=me.id, media_path=rel, mime_type=file.content_type, expires_at=exp, is_archived=False)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": str(s.id), "imageUrl": public_media_url(rel), "expiresAt": exp.isoformat()}


@router.post("/{story_id}/seen", status_code=status.HTTP_204_NO_CONTENT)
def mark_story_seen(
    story_id: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    s = db.get(Story, story_id)
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Story not found")
    author = db.get(User, s.author_id)
    if not author or blocked_pair(db, me.id, author.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Story not found")
    if not _can_view_story(db, me, author, s):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot view")
    row = db.execute(select(StoryView).where(StoryView.story_id == story_id, StoryView.viewer_id == me.id)).first()
    if not row:
        db.add(StoryView(story_id=story_id, viewer_id=me.id))
        db.commit()
    return None


def _can_view_story(db: Session, viewer: User, author: User, story: Story) -> bool:
    if viewer.id == author.id:
        return True
    if story.expires_at <= _now() or story.is_archived:
        return False
    if not author.is_private:
        return True
    return _is_follower(db, viewer.id, author)


class ArchiveItem(BaseModel):
    id: str
    imageUrl: str
    createdAt: str


@router.get("/archive", response_model=list[ArchiveItem])
def story_archive(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ArchiveItem]:
    rows = (
        db.execute(
            select(Story)
            .where(Story.author_id == me.id, Story.is_archived.is_(True))
            .order_by(Story.created_at.desc())
            .limit(200)
        )
        .scalars()
        .all()
    )
    return [
        ArchiveItem(
            id=str(s.id),
            imageUrl=public_media_url(s.media_path),
            createdAt=s.created_at.isoformat(),
        )
        for s in rows
    ]
