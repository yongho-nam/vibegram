from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Hashtag(Base):
    __tablename__ = "hashtags"
    __table_args__ = (UniqueConstraint("tag", name="uq_hashtags_tag"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tag: Mapped[str] = mapped_column(String(191), nullable=False)


class PostHashtag(Base):
    __tablename__ = "post_hashtags"
    __table_args__ = (Index("ix_post_hashtags_hashtag", "hashtag_id"),)

    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    hashtag_id: Mapped[int] = mapped_column(ForeignKey("hashtags.id", ondelete="CASCADE"), primary_key=True)
