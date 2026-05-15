from __future__ import annotations

from datetime import datetime, timezone


def time_ago_ko(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    sec = int((now - dt).total_seconds())
    if sec < 60:
        return f"{sec}초"
    if sec < 3600:
        return f"{sec // 60}분"
    if sec < 86400:
        return f"{sec // 3600}시간"
    if sec < 86400 * 7:
        return f"{sec // 86400}일"
    return f"{sec // (86400 * 7)}주"
