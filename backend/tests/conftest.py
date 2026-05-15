"""테스트 수집 전에 DB·업로드 경로를 격리(임시 디렉터리)로 고정한다."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_root = Path(tempfile.mkdtemp(prefix="pytest_ig_"))
_db = _root / "db.sqlite"
os.environ["DATABASE_URL"] = f"sqlite:///{_db.as_posix()}"
os.environ["UPLOAD_DIR"] = str(_root / "uploads")
os.environ["JWT_SECRET"] = "test-secret-key-at-least-32-chars-long!!"
os.environ["API_PUBLIC_BASE"] = "http://testserver"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:5173"

import shutil

import pytest
from sqlalchemy import text

from app.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def create_schema() -> None:
    import app.models  # noqa: F401 — Base에 모든 테이블 등록

    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    shutil.rmtree(_root, ignore_errors=True)
