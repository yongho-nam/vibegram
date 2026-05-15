from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.comment import Comment, CommentLike
from app.models.notification import Notification
from app.models.post import Post, PostLike, PostMedia, SavedPost
from app.models.user import User
from app.services.media_files import public_media_url
from app.services.notify import notification_text
from app.utils.timefmt import time_ago_ko

if TYPE_CHECKING:
    from app.models.account_extras import NotificationSetting


def _first_media_url(db: Session, post_id: int) -> str | None:
    m = db.execute(
        select(PostMedia).where(PostMedia.post_id == post_id).order_by(PostMedia.sort_order).limit(1)
    ).scalar_one_or_none()
    return public_media_url(m.storage_path) if m else None


def comment_like_count(db: Session, comment_id: int) -> int:
    return int(db.scalar(select(func.count()).select_from(CommentLike).where(CommentLike.comment_id == comment_id)) or 0)


def post_like_count(db: Session, post_id: int) -> int:
    return int(db.scalar(select(func.count()).select_from(PostLike).where(PostLike.post_id == post_id)) or 0)


def _avatar_url(u: User) -> str:
    if not u.avatar_url:
        return ""
    if u.avatar_url.startswith("http"):
        return u.avatar_url
    return public_media_url(u.avatar_url)


def serialize_comment(db: Session, c: Comment, author: User) -> dict:
    return {
        "id": str(c.id),
        "username": author.username,
        "avatarUrl": _avatar_url(author),
        "body": c.body,
        "timeAgo": time_ago_ko(c.created_at),
        "likes": comment_like_count(db, c.id),
    }


def serialize_post_card(db: Session, p: Post, viewer_id: int | None) -> dict:
    author = db.get(User, p.author_id)
    assert author
    img = _first_media_url(db, p.id) or ""
    likes = post_like_count(db, p.id)
    is_liked = False
    is_saved = False
    if viewer_id is not None:
        is_liked = (
            db.execute(select(PostLike).where(PostLike.user_id == viewer_id, PostLike.post_id == p.id)).first()
            is not None
        )
        is_saved = (
            db.execute(select(SavedPost).where(SavedPost.user_id == viewer_id, SavedPost.post_id == p.id)).first()
            is not None
        )
    comments = (
        db.execute(
            select(Comment).where(Comment.post_id == p.id).order_by(Comment.created_at.asc()).limit(80)
        ).scalars().all()
    )
    comm_out = []
    for c in comments:
        u = db.get(User, c.user_id)
        if u:
            comm_out.append(serialize_comment(db, c, u))
    return {
        "id": str(p.id),
        "username": author.username,
        "displayName": author.display_name or author.username,
        "avatarUrl": _avatar_url(author),
        "imageUrl": img,
        "caption": p.caption or "",
        "likes": likes,
        "comments": comm_out,
        "timeAgo": time_ago_ko(p.created_at),
        "location": p.location,
        "isLiked": is_liked,
        "isSaved": is_saved,
        "isOwn": viewer_id is not None and viewer_id == author.id,
    }


def serialize_notification(db: Session, n: Notification) -> dict:
    actor = db.get(User, n.actor_id)
    assert actor
    thumb = n.thumbnail_url
    if thumb and not thumb.startswith("http"):
        thumb = public_media_url(thumb)
    return {
        "id": str(n.id),
        "type": n.type,
        "actorUsername": actor.username,
        "actorAvatar": _avatar_url(actor),
        "text": notification_text(n, actor),
        "timeAgo": time_ago_ko(n.created_at),
        "thumbnailUrl": thumb,
        "isRead": n.is_read,
    }


def serialize_notification_setting(ns: "NotificationSetting") -> dict:
    return {
        "pushLike": ns.push_like,
        "pushComment": ns.push_comment,
        "pushFollow": ns.push_follow,
        "pushMention": ns.push_mention,
        "pushDirect": ns.push_direct,
        "emailDigest": ns.email_digest,
    }
