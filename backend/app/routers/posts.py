from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import Select, and_, delete, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.block import Block
from app.models.comment import Comment
from app.models.follow import Follow
from app.models.post import Post, PostLike, PostMedia, SavedPost
from app.models.user import User
from app.serializers import _first_media_url, serialize_comment, serialize_post_card
from app.services.hashtags import sync_post_hashtags
from app.services.media_files import save_bytes
from app.services.notify import blocked_pair, create_notification
from app.utils.cursor import decode_cursor, encode_cursor

router = APIRouter(prefix="/posts", tags=["posts"])


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _blocked_union(viewer_id: int) -> Select:
    return (
        select(Block.blocked_id.label("uid")).where(Block.blocker_id == viewer_id).union(
            select(Block.blocker_id.label("uid")).where(Block.blocked_id == viewer_id)
        )
    )


def _can_view_author(db: Session, viewer: User | None, author: User) -> bool:
    if viewer and viewer.id == author.id:
        return True
    if not author.is_private:
        return True
    if not viewer:
        return False
    if blocked_pair(db, viewer.id, author.id):
        return False
    row = db.execute(select(Follow).where(Follow.follower_id == viewer.id, Follow.followee_id == author.id)).first()
    return row is not None


def _get_post_or_404(db: Session, post_id: int) -> Post:
    p = db.get(Post, post_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return p


def _assert_post_viewable(db: Session, post: Post, viewer: User | None) -> None:
    author = db.get(User, post.author_id)
    if not author:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    if viewer and blocked_pair(db, viewer.id, author.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    if not _can_view_author(db, viewer, author):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")


def _feed_base_query(db: Session, viewer: User | None) -> Select:
    q = select(Post).join(User, User.id == Post.author_id)
    if viewer:
        bids = [r[0] for r in db.execute(_blocked_union(viewer.id)).all()]
        if bids:
            q = q.where(Post.author_id.notin_(bids))
        fids = [r[0] for r in db.execute(select(Follow.followee_id).where(Follow.follower_id == viewer.id)).all()]
        if fids:
            q = q.where(or_(Post.author_id == viewer.id, Post.author_id.in_(fids)))
        else:
            q = q.where(Post.author_id == viewer.id)
    else:
        q = q.where(User.is_private.is_(False))
    return q


def _explore_base_query(db: Session, viewer: User | None) -> Select:
    q = select(Post).join(User, User.id == Post.author_id).where(User.is_private.is_(False))
    if viewer:
        bids = [r[0] for r in db.execute(_blocked_union(viewer.id)).all()]
        if bids:
            q = q.where(Post.author_id.notin_(bids))
    return q


def _apply_cursor_desc(q: Select, cursor: str | None) -> Select:
    t, rid = decode_cursor(cursor)
    if t is not None and rid is not None:
        q = q.where(or_(Post.created_at < t, and_(Post.created_at == t, Post.id < rid)))
    return q.order_by(Post.created_at.desc(), Post.id.desc())


class FeedOut(BaseModel):
    items: list[dict]
    next_cursor: str | None = None


@router.get("/feed", response_model=FeedOut)
def feed(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    limit: int = 20,
    cursor: str | None = None,
) -> FeedOut:
    limit = min(max(limit, 1), 50)
    q = _feed_base_query(db, viewer)
    q = _apply_cursor_desc(q, cursor)
    rows = db.execute(q.limit(limit + 1)).scalars().all()
    next_c = None
    if len(rows) > limit:
        last = rows[limit - 1]
        next_c = encode_cursor(last.created_at, last.id)
        rows = rows[:limit]
    vid = viewer.id if viewer else None
    return FeedOut(items=[serialize_post_card(db, p, vid) for p in rows], next_cursor=next_c)


@router.get("/explore", response_model=FeedOut)
def explore(
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    limit: int = 20,
    cursor: str | None = None,
) -> FeedOut:
    limit = min(max(limit, 1), 50)
    q = _explore_base_query(db, viewer)
    q = _apply_cursor_desc(q, cursor)
    rows = db.execute(q.limit(limit + 1)).scalars().all()
    next_c = None
    if len(rows) > limit:
        last = rows[limit - 1]
        next_c = encode_cursor(last.created_at, last.id)
        rows = rows[:limit]
    vid = viewer.id if viewer else None
    return FeedOut(items=[serialize_post_card(db, p, vid) for p in rows], next_cursor=next_c)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_post(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    files: list[UploadFile] = File(...),
    caption: str | None = Form(None),
    location: str | None = Form(None),
) -> dict:
    if not files:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "At least one image required")
    p = Post(author_id=me.id, caption=caption.strip() if caption else None, location=location.strip() if location else None)
    db.add(p)
    db.flush()
    for i, uf in enumerate(files):
        data = await uf.read()
        if len(data) > 15_000_000:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large")
        ext = ".jpg"
        ct = uf.content_type or ""
        if "png" in ct:
            ext = ".png"
        elif "webp" in ct:
            ext = ".webp"
        rel = save_bytes("posts", data, ext)
        db.add(PostMedia(post_id=p.id, storage_path=rel, mime_type=uf.content_type, sort_order=i))
    sync_post_hashtags(db, p, p.caption)
    me.updated_at = _utc_now()
    db.commit()
    db.refresh(p)
    return serialize_post_card(db, p, me.id)


@router.get("/{post_id}", response_model=dict)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> dict:
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, viewer)
    return serialize_post_card(db, p, viewer.id if viewer else None)


class CommentsPage(BaseModel):
    items: list[dict]
    next_cursor: str | None = None


@router.get("/{post_id}/comments", response_model=CommentsPage)
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
    limit: int = 20,
    cursor: str | None = None,
) -> CommentsPage:
    limit = min(max(limit, 1), 50)
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, viewer)
    t, cid = decode_cursor(cursor)
    q = select(Comment).where(Comment.post_id == post_id, Comment.parent_id.is_(None))
    if t is not None and cid is not None:
        q = q.where(or_(Comment.created_at > t, and_(Comment.created_at == t, Comment.id > cid)))
    q = q.order_by(Comment.created_at.asc(), Comment.id.asc())
    rows = db.execute(q.limit(limit + 1)).scalars().all()
    next_c = None
    if len(rows) > limit:
        last = rows[limit - 1]
        next_c = encode_cursor(last.created_at, last.id)
        rows = rows[:limit]
    out: list[dict] = []
    for c in rows:
        u = db.get(User, c.user_id)
        if u:
            out.append(serialize_comment(db, c, u))
    return CommentsPage(items=out, next_cursor=next_c)


class CommentIn(BaseModel):
    body: str = Field(..., min_length=1, max_length=4000)
    parent_id: int | None = None


@router.post("/{post_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: int,
    body: CommentIn,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, me)
    if body.parent_id:
        parent = db.get(Comment, body.parent_id)
        if not parent or parent.post_id != post_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid parent")
    c = Comment(post_id=post_id, user_id=me.id, body=body.body.strip(), parent_id=body.parent_id)
    db.add(c)
    db.flush()
    author_post = db.get(User, p.author_id)
    assert author_post
    thumb = _first_media_url(db, p.id)
    create_notification(
        db,
        recipient_id=p.author_id,
        actor_id=me.id,
        notif_type="comment",
        post_id=p.id,
        comment_id=c.id,
        thumbnail_url=thumb,
    )
    db.commit()
    db.refresh(c)
    return serialize_comment(db, c, me)


@router.post("/{post_id}/like", status_code=status.HTTP_201_CREATED)
def like_post(post_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, me)
    exists = db.execute(select(PostLike).where(PostLike.user_id == me.id, PostLike.post_id == post_id)).first()
    if exists:
        return None
    db.add(PostLike(user_id=me.id, post_id=post_id))
    thumb = _first_media_url(db, p.id)
    create_notification(db, recipient_id=p.author_id, actor_id=me.id, notif_type="like", post_id=p.id, thumbnail_url=thumb)
    db.commit()
    return None


@router.delete("/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(post_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, me)
    db.execute(delete(PostLike).where(PostLike.user_id == me.id, PostLike.post_id == post_id))
    db.commit()


@router.post("/{post_id}/save", status_code=status.HTTP_201_CREATED)
def save_post(post_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    p = _get_post_or_404(db, post_id)
    _assert_post_viewable(db, p, me)
    exists = db.execute(select(SavedPost).where(SavedPost.user_id == me.id, SavedPost.post_id == post_id)).first()
    if exists:
        return None
    db.add(SavedPost(user_id=me.id, post_id=post_id))
    db.commit()
    return None


@router.delete("/{post_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_post(post_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    _get_post_or_404(db, post_id)
    db.execute(delete(SavedPost).where(SavedPost.user_id == me.id, SavedPost.post_id == post_id))
    db.commit()


class PostPatchIn(BaseModel):
    caption: str | None = None
    location: str | None = None


@router.patch("/{post_id}", response_model=dict)
def patch_post(
    post_id: int,
    body: PostPatchIn,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    p = _get_post_or_404(db, post_id)
    if p.author_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your post")
    if body.caption is not None:
        p.caption = body.caption.strip() or None
        sync_post_hashtags(db, p, p.caption)
    if body.location is not None:
        p.location = body.location.strip() or None
    p.updated_at = _utc_now()
    db.commit()
    db.refresh(p)
    return serialize_post_card(db, p, me.id)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, me: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    p = _get_post_or_404(db, post_id)
    if p.author_id != me.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your post")
    db.delete(p)
    db.commit()
