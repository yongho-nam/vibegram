"""Opaque cursor: base64url(JSON {created_at, id})."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Any


def encode_cursor(created_at: datetime, row_id: int) -> str:
    payload = {"t": created_at.isoformat(), "id": row_id}
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(cursor: str | None) -> tuple[datetime | None, int | None]:
    if not cursor:
        return None, None
    pad = "=" * (-len(cursor) % 4)
    try:
        raw = base64.urlsafe_b64decode(cursor + pad)
        data = json.loads(raw.decode("utf-8"))
        return datetime.fromisoformat(data["t"]), int(data["id"])
    except (ValueError, KeyError, json.JSONDecodeError):
        return None, None
