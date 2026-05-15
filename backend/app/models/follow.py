from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        PrimaryKeyConstraint("follower_id", "followee_id", name="pk_follows"),
        CheckConstraint("follower_id <> followee_id", name="ck_follows_not_self"),
        Index("ix_follows_followee", "followee_id"),
    )

    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, nullable=False)
