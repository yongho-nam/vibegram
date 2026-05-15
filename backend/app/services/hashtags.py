from __future__ import annotations

import re
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    pass

from app.models.hashtag import Hashtag, PostHashtag
from app.models.post import Post


_TAG_RE = re.compile(r"#([\w가-힣_]+)", re.UNICODE)


def sync_post_hashtags(db: Session, post: Post, caption: str | None) -> None:
    if not caption:
        return
    tags = {m.group(1).lower() for m in _TAG_RE.finditer(caption)}
    if not tags:
        return
    for tag in tags:
        row = db.execute(select(Hashtag).where(Hashtag.tag == tag)).scalar_one_or_none()
        if not row:
            row = Hashtag(tag=tag)
            db.add(row)
            db.flush()
        exists = db.execute(
            select(PostHashtag).where(PostHashtag.post_id == post.id, PostHashtag.hashtag_id == row.id)
        ).scalar_one_or_none()
        if not exists:
            db.add(PostHashtag(post_id=post.id, hashtag_id=row.id))
