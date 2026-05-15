"""ORM 테이블 등록 — FK 의존 순서대로 import (`Base.metadata.create_all` 전에 로드)."""

from app.models.user import User
from app.models.follow import Follow
from app.models.post import Post, PostLike, PostMedia, SavedPost
from app.models.comment import Comment, CommentLike
from app.models.hashtag import Hashtag, PostHashtag
from app.models.story import Story, StoryView
from app.models.message import Message, MessageThread, ThreadParticipant
from app.models.notification import Notification
from app.models.block import Block
from app.models.account_extras import LoginSession, NotificationSetting
from app.models.password_reset import PasswordResetToken

__all__ = [
    "User",
    "Follow",
    "Post",
    "PostMedia",
    "PostLike",
    "SavedPost",
    "Comment",
    "CommentLike",
    "Hashtag",
    "PostHashtag",
    "Story",
    "StoryView",
    "MessageThread",
    "ThreadParticipant",
    "Message",
    "Notification",
    "Block",
    "NotificationSetting",
    "LoginSession",
    "PasswordResetToken",
]
