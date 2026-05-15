from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_optional_user
from app.models.hashtag import Hashtag, PostHashtag
from app.models.user import User
from app.serializers import _avatar_url

router = APIRouter(prefix="/search", tags=["search"])


class UserHit(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str


class TagHit(BaseModel):
    tag: str
    posts: int


@router.get("/users", response_model=list[UserHit])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    _viewer: User | None = Depends(get_optional_user),
    limit: int = 30,
) -> list[UserHit]:
    q = (q or "").strip().lower()
    limit = min(max(limit, 1), 50)
    if not q:
        return []
    rows = (
        db.execute(
            select(User)
            .where(User.username.ilike(f"%{q}%") | User.display_name.ilike(f"%{q}%"))
            .order_by(User.username.asc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [
        UserHit(id=str(u.id), username=u.username, displayName=u.display_name or u.username, avatarUrl=_avatar_url(u))
        for u in rows
    ]


@router.get("/tags", response_model=list[TagHit])
def search_tags(q: str, db: Session = Depends(get_db), limit: int = 30) -> list[TagHit]:
    raw = (q or "").strip().lstrip("#").lower()
    limit = min(max(limit, 1), 50)
    if not raw:
        return []
    cnt = func.count(PostHashtag.post_id).label("c")
    rows = (
        db.execute(
            select(Hashtag.tag, cnt)
            .join(PostHashtag, PostHashtag.hashtag_id == Hashtag.id)
            .where(Hashtag.tag.ilike(f"%{raw}%"))
            .group_by(Hashtag.id, Hashtag.tag)
            .order_by(cnt.desc())
            .limit(limit)
        )
        .all()
    )
    return [TagHit(tag=f"#{t}", posts=int(c or 0)) for t, c in rows]
