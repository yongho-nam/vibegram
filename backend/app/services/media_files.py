from __future__ import annotations

import os
import re
import uuid
from pathlib import Path

from app.config import settings


def ensure_upload_dirs() -> None:
    base = Path(settings.upload_dir)
    (base / "avatars").mkdir(parents=True, exist_ok=True)
    (base / "posts").mkdir(parents=True, exist_ok=True)
    (base / "stories").mkdir(parents=True, exist_ok=True)


def public_media_url(relative_path: str) -> str:
    rel = relative_path.lstrip("/")
    return f"{settings.api_public_base.rstrip('/')}/media/{rel}"


def save_bytes(subdir: str, data: bytes, suffix: str) -> str:
    ensure_upload_dirs()
    name = f"{uuid.uuid4().hex}{suffix}"
    rel = f"{subdir}/{name}"
    path = Path(settings.upload_dir) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return rel.replace("\\", "/")
