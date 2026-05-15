from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Block(Base):
    __tablename__ = "blocks"
    __table_args__ = (
        PrimaryKeyConstraint("blocker_id", "blocked_id", name="pk_blocks"),
        CheckConstraint("blocker_id <> blocked_id", name="ck_blocks_not_self"),
        Index("ix_blocks_blocked", "blocked_id"),
    )

    blocker_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blocked_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utc_now, nullable=False)
