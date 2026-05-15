"""Alembic 마이그레이션 실행 (APP_ENV / DATABASE_URL 기준 DB 자동 선택).

사용 예 (backend/ 디렉터리):

  python scripts/migrate.py              # upgrade head
  python scripts/migrate.py current      # 현재 리비전
  python scripts/migrate.py history      # 리비전 목록
  python scripts/migrate.py downgrade -1 # 한 단계 롤백
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _mask_url(url: str) -> str:
    if "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    if "@" not in rest:
        return url
    creds, hostpart = rest.rsplit("@", 1)
    if ":" in creds:
        user = creds.split(":", 1)[0]
        return f"{scheme}://{user}:***@{hostpart}"
    return f"{scheme}://***@{hostpart}"


def main(argv: list[str] | None = None) -> int:
    from alembic import command
    from alembic.config import Config

    from app.config import settings

    args = argv if argv is not None else sys.argv[1:]
    cmd = args[0] if args else "upgrade"
    rest = args[1:]

    dialect = "SQLite" if settings.is_sqlite else "PostgreSQL"
    print(f"[migrate] APP_ENV={settings.app_env}  dialect={dialect}")
    print(f"[migrate] URL={_mask_url(settings.database_url)}")

    cfg = Config(str(BACKEND_ROOT / "alembic.ini"))

    if cmd in ("upgrade", "up"):
        rev = rest[0] if rest else "head"
        command.upgrade(cfg, rev)
        print(f"[migrate] OK upgrade -> {rev}")
        return 0
    if cmd == "current":
        command.current(cfg)
        return 0
    if cmd == "history":
        command.history(cfg)
        return 0
    if cmd == "downgrade":
        rev = rest[0] if rest else "-1"
        command.downgrade(cfg, rev)
        print(f"[migrate] OK downgrade -> {rev}")
        return 0
    if cmd == "stamp":
        rev = rest[0] if rest else "head"
        command.stamp(cfg, rev)
        print(f"[migrate] OK stamp -> {rev}")
        return 0

    print(__doc__ or "")
    print("commands: upgrade [head], current, history, downgrade [-1], stamp [head]")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
