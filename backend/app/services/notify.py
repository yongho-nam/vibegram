from __future__ import annotations

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models.account_extras import NotificationSetting
from app.models.block import Block
from app.models.notification import Notification
from app.models.user import User


def blocked_pair(db: Session, a_id: int, b_id: int) -> bool:
    if a_id == b_id:
        return False
    q = select(Block).where(
        or_(
            and_(Block.blocker_id == a_id, Block.blocked_id == b_id),
            and_(Block.blocker_id == b_id, Block.blocked_id == a_id),
        )
    )
    return db.execute(q).first() is not None


def notification_text(n: Notification, actor: User) -> str:
    un = actor.username
    if n.type == "like":
        return f"{un}님이 회원님의 게시물을 좋아합니다."
    if n.type == "follow":
        return f"{un}님이 회원님을 팔로우하기 시작했습니다."
    if n.type == "comment":
        return f"{un}님이 댓글을 남겼습니다."
    if n.type == "mention":
        return f"{un}님이 회원님을 언급했습니다."
    return f"{un}님의 알림"


def _push_enabled(db: Session, recipient_id: int, notif_type: str) -> bool:
    ns = db.get(NotificationSetting, recipient_id)
    if not ns:
        return True
    key = {
        "like": ns.push_like,
        "comment": ns.push_comment,
        "follow": ns.push_follow,
        "mention": ns.push_mention,
    }.get(notif_type, True)
    return bool(key)


def create_notification(
    db: Session,
    *,
    recipient_id: int,
    actor_id: int,
    notif_type: str,
    post_id: int | None = None,
    comment_id: int | None = None,
    thumbnail_url: str | None = None,
) -> None:
    if recipient_id == actor_id:
        return
    if blocked_pair(db, recipient_id, actor_id):
        return
    if not _push_enabled(db, recipient_id, notif_type):
        return
    db.add(
        Notification(
            recipient_id=recipient_id,
            actor_id=actor_id,
            type=notif_type,
            post_id=post_id,
            comment_id=comment_id,
            thumbnail_url=thumbnail_url,
        )
    )
