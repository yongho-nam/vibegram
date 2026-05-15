from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.account_extras import LoginSession, NotificationSetting
from app.models.block import Block
from app.models.follow import Follow
from app.models.post import Post
from app.models.user import User
from app.serializers import _avatar_url, serialize_notification_setting
from app.services.media_files import save_bytes
from app.services.notify import blocked_pair

router = APIRouter(prefix="/users", tags=["users"])


# --- /me ---


class UserMeOut(BaseModel):
    id: str
    username: str
    email: str
    displayName: str
    avatarUrl: str
    bio: str | None = None
    website: str | None = None
    isAdmin: bool = False


class UserMePatch(BaseModel):
    username: str | None = Field(None, min_length=2, max_length=30)
    email: EmailStr | None = None
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = None
    website: str | None = Field(None, max_length=512)


def _to_me_out(u: User) -> UserMeOut:
    return UserMeOut(
        id=str(u.id),
        username=u.username,
        email=u.email,
        displayName=u.display_name or u.username,
        avatarUrl=_avatar_url(u),
        bio=u.bio,
        website=u.website,
        isAdmin=bool(u.is_admin),
    )


@router.get("/me", response_model=UserMeOut)
def get_me(me: User = Depends(get_current_user)) -> UserMeOut:
    return _to_me_out(me)


@router.patch("/me", response_model=UserMeOut)
def patch_me(body: UserMePatch, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserMeOut:
    if body.username and body.username != me.username:
        if db.execute(select(User).where(User.username == body.username)).first():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Username taken")
        me.username = body.username
    if body.email and body.email.lower() != me.email:
        el = body.email.lower()
        if db.execute(select(User).where(User.email == el)).first():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email taken")
        me.email = el
    if body.display_name is not None:
        me.display_name = body.display_name
    if body.bio is not None:
        me.bio = body.bio
    if body.website is not None:
        me.website = body.website or None
    me.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(me)
    return _to_me_out(me)


@router.post("/me/avatar", response_model=UserMeOut)
async def upload_avatar(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
) -> UserMeOut:
    data = await file.read()
    if len(data) > 8_000_000:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large")
    ext = ".jpg"
    if file.content_type == "image/png":
        ext = ".png"
    elif file.content_type == "image/webp":
        ext = ".webp"
    rel = save_bytes("avatars", data, ext)
    me.avatar_url = rel
    me.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(me)
    return _to_me_out(me)


class PasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=3, max_length=128)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(body: PasswordIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    if not verify_password(body.current_password, me.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password incorrect")
    me.password_hash = hash_password(body.new_password)
    me.updated_at = datetime.now(timezone.utc)
    db.commit()


class PrivacyOut(BaseModel):
    is_private: bool
    show_activity_status: bool
    allow_tags: bool


class PrivacyPatch(BaseModel):
    is_private: bool | None = None
    show_activity_status: bool | None = None
    allow_tags: bool | None = None


@router.get("/me/privacy", response_model=PrivacyOut)
def get_privacy(me: User = Depends(get_current_user)) -> PrivacyOut:
    return PrivacyOut(
        is_private=me.is_private,
        show_activity_status=me.show_activity_status,
        allow_tags=me.allow_tags,
    )


@router.patch("/me/privacy", response_model=PrivacyOut)
def patch_privacy(body: PrivacyPatch, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PrivacyOut:
    if body.is_private is not None:
        me.is_private = body.is_private
    if body.show_activity_status is not None:
        me.show_activity_status = body.show_activity_status
    if body.allow_tags is not None:
        me.allow_tags = body.allow_tags
    me.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(me)
    return PrivacyOut(
        is_private=me.is_private,
        show_activity_status=me.show_activity_status,
        allow_tags=me.allow_tags,
    )


class SecurityOut(BaseModel):
    two_factor_enabled: bool
    login_alerts_enabled: bool


class SecurityPatch(BaseModel):
    two_factor_enabled: bool | None = None
    login_alerts_enabled: bool | None = None


@router.get("/me/security", response_model=SecurityOut)
def get_security(me: User = Depends(get_current_user)) -> SecurityOut:
    return SecurityOut(two_factor_enabled=me.two_factor_enabled, login_alerts_enabled=me.login_alerts_enabled)


@router.patch("/me/security", response_model=SecurityOut)
def patch_security(body: SecurityPatch, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SecurityOut:
    if body.two_factor_enabled is not None:
        me.two_factor_enabled = body.two_factor_enabled
    if body.login_alerts_enabled is not None:
        me.login_alerts_enabled = body.login_alerts_enabled
    me.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(me)
    return SecurityOut(two_factor_enabled=me.two_factor_enabled, login_alerts_enabled=me.login_alerts_enabled)


class SessionOut(BaseModel):
    id: str
    label: str
    meta: str
    is_current: bool


@router.get("/me/sessions", response_model=list[SessionOut])
def list_sessions(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[SessionOut]:
    rows = db.execute(select(LoginSession).where(LoginSession.user_id == me.id).order_by(LoginSession.last_seen_at.desc())).scalars().all()
    out: list[SessionOut] = []
    for s in rows:
        label = (s.user_agent or "웹 브라우저")[:80]
        meta = f"등록 {timefmt_short(s.created_at)}"
        out.append(SessionOut(id=str(s.id), label=label, meta=meta, is_current=s.is_current))
    return out


def timefmt_short(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")


@router.delete("/me/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    s = db.get(LoginSession, session_id)
    if not s or s.user_id != me.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    if s.is_current:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot revoke current session here")
    db.delete(s)
    db.commit()


class BlockedUserOut(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str


@router.get("/me/blocks", response_model=list[BlockedUserOut])
def list_blocks(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[BlockedUserOut]:
    q = select(User).join(Block, Block.blocked_id == User.id).where(Block.blocker_id == me.id)
    users = db.execute(q).scalars().all()
    return [
        BlockedUserOut(
            id=str(u.id),
            username=u.username,
            displayName=u.display_name or u.username,
            avatarUrl=_avatar_url(u),
        )
        for u in users
    ]


class BlockIn(BaseModel):
    blocked_user_id: int


@router.post("/me/blocks", response_model=BlockedUserOut, status_code=status.HTTP_201_CREATED)
def add_block(body: BlockIn, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BlockedUserOut:
    if body.blocked_user_id == me.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid")
    other = db.get(User, body.blocked_user_id)
    if not other:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    exists = db.execute(select(Block).where(Block.blocker_id == me.id, Block.blocked_id == other.id)).first()
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already blocked")
    db.add(Block(blocker_id=me.id, blocked_id=other.id))
    db.execute(delete(Follow).where((Follow.follower_id == me.id) & (Follow.followee_id == other.id)))
    db.execute(delete(Follow).where((Follow.follower_id == other.id) & (Follow.followee_id == me.id)))
    db.commit()
    return BlockedUserOut(
        id=str(other.id), username=other.username, displayName=other.display_name or other.username, avatarUrl=_avatar_url(other)
    )


@router.delete("/me/blocks/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def unblock(user_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.execute(delete(Block).where(Block.blocker_id == me.id, Block.blocked_id == user_id))
    db.commit()


class NotifSettingsPatch(BaseModel):
    push_like: bool | None = None
    push_comment: bool | None = None
    push_follow: bool | None = None
    push_mention: bool | None = None
    push_direct: bool | None = None
    email_digest: bool | None = None


@router.get("/me/notification-settings")
def get_notif_settings(me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    ns = db.get(NotificationSetting, me.id)
    if not ns:
        ns = NotificationSetting(user_id=me.id)
        db.add(ns)
        db.commit()
        db.refresh(ns)
    return serialize_notification_setting(ns)


@router.patch("/me/notification-settings")
def patch_notif_settings(
    body: NotifSettingsPatch, me: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    ns = db.get(NotificationSetting, me.id)
    if not ns:
        ns = NotificationSetting(user_id=me.id)
        db.add(ns)
        db.flush()
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(ns, k, v)
    ns.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ns)
    return serialize_notification_setting(ns)


# --- 팔로우 추천 (경로가 /{username} 보다 먼저 등록되어야 함) ---


class SuggestFollowRow(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str


@router.get("/suggest-follows", response_model=list[SuggestFollowRow])
def suggest_follows(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    limit: int = Query(15, ge=1, le=50),
) -> list[SuggestFollowRow]:
    lim = min(max(limit, 1), 50)
    if viewer is None:
        rows = (
            db.execute(select(User).where(User.is_private.is_(False)).order_by(func.random()).limit(lim))
            .scalars()
            .all()
        )
        return [
            SuggestFollowRow(
                id=str(u.id),
                username=u.username,
                displayName=u.display_name or u.username,
                avatarUrl=_avatar_url(u),
            )
            for u in rows
        ]

    following_subq = select(Follow.followee_id).where(Follow.follower_id == viewer.id)
    blocked_union = (
        select(Block.blocked_id.label("uid"))
        .where(Block.blocker_id == viewer.id)
        .union(select(Block.blocker_id.label("uid")).where(Block.blocked_id == viewer.id))
    )
    bids = [r[0] for r in db.execute(blocked_union).all()]
    crit = [User.id != viewer.id, User.id.notin_(following_subq)]
    if bids:
        crit.append(User.id.notin_(bids))
    rows = db.execute(select(User).where(*crit).order_by(func.random()).limit(lim)).scalars().all()
    return [
        SuggestFollowRow(
            id=str(u.id),
            username=u.username,
            displayName=u.display_name or u.username,
            avatarUrl=_avatar_url(u),
        )
        for u in rows
    ]


# --- public profile ---


class ProfileOut(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str
    bio: str
    posts: int
    followers: int
    following: int
    isFollowing: bool
    isOwn: bool


@router.get("/{username}", response_model=ProfileOut)
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> ProfileOut:
    u = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if viewer and blocked_pair(db, viewer.id, u.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    posts_n = db.scalar(select(func.count()).select_from(Post).where(Post.author_id == u.id)) or 0
    followers_n = db.scalar(select(func.count()).select_from(Follow).where(Follow.followee_id == u.id)) or 0
    following_n = db.scalar(select(func.count()).select_from(Follow).where(Follow.follower_id == u.id)) or 0
    is_following = False
    if viewer:
        is_following = (
            db.execute(select(Follow).where(Follow.follower_id == viewer.id, Follow.followee_id == u.id)).first()
            is not None
        )
    is_own = bool(viewer and viewer.id == u.id)
    return ProfileOut(
        id=str(u.id),
        username=u.username,
        displayName=u.display_name or u.username,
        avatarUrl=_avatar_url(u),
        bio=u.bio or "",
        posts=int(posts_n),
        followers=int(followers_n),
        following=int(following_n),
        isFollowing=is_following,
        isOwn=is_own,
    )


class PostGridItem(BaseModel):
    id: str
    imageUrl: str


class PostGridOut(BaseModel):
    items: list[PostGridItem]
    next_cursor: str | None = None


@router.get("/{username}/posts", response_model=PostGridOut)
def list_user_posts(
    username: str,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    limit: int = 20,
) -> PostGridOut:
    from app.models.post import PostMedia
    from app.serializers import _first_media_url

    u = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if u.is_private and (not viewer or (viewer.id != u.id and not _is_following(db, viewer.id, u.id))):
        return PostGridOut(items=[], next_cursor=None)
    rows = (
        db.execute(select(Post).where(Post.author_id == u.id).order_by(Post.created_at.desc()).limit(limit))
        .scalars()
        .all()
    )
    items = []
    for p in rows:
        url = _first_media_url(db, p.id) or ""
        items.append(PostGridItem(id=str(p.id), imageUrl=url))
    return PostGridOut(items=items, next_cursor=None)


def _is_following(db: Session, follower_id: int, followee_id: int) -> bool:
    return (
        db.execute(select(Follow).where(Follow.follower_id == follower_id, Follow.followee_id == followee_id)).first()
        is not None
    )


class FollowerRow(BaseModel):
    id: str
    username: str
    displayName: str
    avatarUrl: str
    subtitle: str | None = None


@router.get("/{username}/followers", response_model=list[FollowerRow])
def list_followers(username: str, db: Session = Depends(get_db), viewer: User | None = Depends(get_optional_user)) -> list[FollowerRow]:
    u = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    q = select(User).join(Follow, Follow.follower_id == User.id).where(Follow.followee_id == u.id)
    rows = db.execute(q).scalars().all()
    return [
        FollowerRow(
            id=str(x.id),
            username=x.username,
            displayName=x.display_name or x.username,
            avatarUrl=_avatar_url(x),
            subtitle="회원님을 팔로우합니다",
        )
        for x in rows
    ]


@router.get("/{username}/following", response_model=list[FollowerRow])
def list_following(username: str, db: Session = Depends(get_db)) -> list[FollowerRow]:
    u = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    q = select(User).join(Follow, Follow.followee_id == User.id).where(Follow.follower_id == u.id)
    rows = db.execute(q).scalars().all()
    return [
        FollowerRow(
            id=str(x.id),
            username=x.username,
            displayName=x.display_name or x.username,
            avatarUrl=_avatar_url(x),
            subtitle=None,
        )
        for x in rows
    ]


@router.delete("/{username}/followers/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_follower(
    username: str,
    user_id: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if me.username != username:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your profile")
    db.execute(delete(Follow).where(Follow.follower_id == user_id, Follow.followee_id == me.id))
    db.commit()


@router.post("/{username}/follow", status_code=status.HTTP_201_CREATED)
def follow_user(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    other = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not other or other.id == me.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid")
    if blocked_pair(db, me.id, other.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Blocked")
    exists = db.execute(select(Follow).where(Follow.follower_id == me.id, Follow.followee_id == other.id)).first()
    if exists:
        return Response(status_code=status.HTTP_200_OK)
    db.add(Follow(follower_id=me.id, followee_id=other.id))
    from app.services.notify import create_notification

    create_notification(db, recipient_id=other.id, actor_id=me.id, notif_type="follow")
    db.commit()
    return Response(status_code=status.HTTP_201_CREATED)


@router.delete("/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
def unfollow_user(username: str, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    other = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not other:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    db.execute(delete(Follow).where(Follow.follower_id == me.id, Follow.followee_id == other.id))
    db.commit()
