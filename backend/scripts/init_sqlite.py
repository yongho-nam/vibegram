"""SQLite 스키마를 Alembic 마이그레이션으로 적용합니다.

사용 예 (저장소 `backend/` 기준):

  python scripts/init_sqlite.py

또는:

  alembic upgrade head

`DATABASE_URL`은 `app.config` / `.env` 기본값(`sqlite:///./instagram.db`)을 따릅니다.
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def main() -> None:
    from alembic.config import Config
    from alembic import command

    ini = BACKEND_ROOT / "alembic.ini"
    cfg = Config(str(ini))
    # env.py 가 app.config 의 URL 을 쓰므로 여기서는 경로만 지정
    command.upgrade(cfg, "head")
    print("OK — alembic upgrade head")


if __name__ == "__main__":
    main()
