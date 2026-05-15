from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.post import Post
from app.models.user import User
from app.serializers import _first_media_url, _avatar_url

router = APIRouter(prefix="/admin", tags=["admin"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AdminStatsOut(BaseModel):
    totalUsers: int
    totalPosts: int
    usersLast7Days: int
    postsLast7Days: int


@router.get("/stats", response_model=AdminStatsOut)
def admin_stats(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)) -> AdminStatsOut:
    total_users = int(db.scalar(select(func.count()).select_from(User)) or 0)
    total_posts = int(db.scalar(select(func.count()).select_from(Post)) or 0)
    since = _utc_now() - timedelta(days=7)
    users_7 = int(db.scalar(select(func.count()).select_from(User).where(User.created_at >= since)) or 0)
    posts_7 = int(db.scalar(select(func.count()).select_from(Post).where(Post.created_at >= since)) or 0)
    return AdminStatsOut(
        totalUsers=total_users,
        totalPosts=total_posts,
        usersLast7Days=users_7,
        postsLast7Days=posts_7,
    )


class AdminUserRow(BaseModel):
    id: str
    username: str
    email: str
    displayName: str
    avatarUrl: str
    createdAt: str
    isAdmin: bool
    postsCount: int


class AdminUsersPage(BaseModel):
    items: list[AdminUserRow]
    next_offset: int | None = None


@router.get("/users", response_model=AdminUsersPage)
def admin_list_users(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
) -> AdminUsersPage:
    lim = min(limit, 100)
    rows = (
        db.execute(select(User).order_by(User.id.desc()).offset(offset).limit(lim + 1)).scalars().all()
    )
    has_more = len(rows) > lim
    rows = rows[:lim]
    items: list[AdminUserRow] = []
    for u in rows:
        pc = int(db.scalar(select(func.count()).select_from(Post).where(Post.author_id == u.id)) or 0)
        items.append(
            AdminUserRow(
                id=str(u.id),
                username=u.username,
                email=u.email,
                displayName=u.display_name or u.username,
                avatarUrl=_avatar_url(u),
                createdAt=u.created_at.isoformat(),
                isAdmin=u.is_admin,
                postsCount=pc,
            )
        )
    return AdminUsersPage(items=items, next_offset=offset + lim if has_more else None)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete your own account")
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if u.is_admin:
        n_admins = int(db.scalar(select(func.count()).select_from(User).where(User.is_admin.is_(True))) or 0)
        if n_admins <= 1:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete the only admin account")
    db.delete(u)
    db.commit()


class AdminPostRow(BaseModel):
    id: str
    authorId: str
    authorUsername: str
    imageUrl: str
    caption: str
    createdAt: str


class AdminPostsPage(BaseModel):
    items: list[AdminPostRow]
    next_cursor: str | None = None


@router.get("/posts", response_model=AdminPostsPage)
def admin_list_posts(
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    cursor: int | None = Query(None, ge=1),
    limit: int = Query(25, ge=1, le=100),
) -> AdminPostsPage:
    lim = min(limit, 100)
    q = select(Post).order_by(Post.id.desc())
    if cursor is not None:
        q = q.where(Post.id < cursor)
    rows = db.execute(q.limit(lim + 1)).scalars().all()
    has_more = len(rows) > lim
    rows = rows[:lim]
    items: list[AdminPostRow] = []
    for p in rows:
        author = db.get(User, p.author_id)
        if not author:
            continue
        img = _first_media_url(db, p.id) or ""
        items.append(
            AdminPostRow(
                id=str(p.id),
                authorId=str(author.id),
                authorUsername=author.username,
                imageUrl=img,
                caption=p.caption or "",
                createdAt=p.created_at.isoformat(),
            )
        )
    last_id = int(items[-1].id) if items else None
    return AdminPostsPage(items=items, next_cursor=str(last_id) if has_more and last_id is not None else None)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_post(
    post_id: int,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    db.delete(p)
    db.commit()
