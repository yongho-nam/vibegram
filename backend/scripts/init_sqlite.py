"""SQLite 스키마를 Alembic 마이그레이션으로 적용합니다.

사용 예 (저장소 `backend/` 기준):

  python scripts/init_sqlite.py

또는:

  alembic upgrade head

`APP_ENV`·`DATABASE_URL`은 `app.config`를 따릅니다(development 기본 → SQLite).
서버(PostgreSQL)에서도 동일하게 `alembic upgrade head`를 실행하면 됩니다.
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def main() -> None:
    from alembic import command
    from alembic.config import Config

    command.upgrade(Config(str(BACKEND_ROOT / "alembic.ini")), "head")
    print("OK - alembic upgrade head")


if __name__ == "__main__":
    main()
