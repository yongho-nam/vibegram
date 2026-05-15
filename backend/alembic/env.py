"""Alembic migration environment — APP_ENV / DATABASE_URL 에 따라 SQLite 또는 PostgreSQL."""

from __future__ import annotations

import logging
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.config import settings  # noqa: E402
from app.database import Base, create_db_engine  # noqa: E402

import app.models  # noqa: F401, E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ConfigParser는 % 를 보간으로 쓰므로 URL 이스케이프
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

target_metadata = Base.metadata

# SQLite만 batch ALTER(테이블 재생성). PostgreSQL은 일반 DDL.
_use_batch = settings.is_sqlite

_log = logging.getLogger("alembic.env")
_log.info(
    "APP_ENV=%s dialect=%s batch_mode=%s",
    settings.app_env,
    "sqlite" if settings.is_sqlite else "postgresql",
    _use_batch,
)


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=_use_batch,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """앱과 동일한 Engine 팩토리(FK pragma·pool_pre_ping)로 마이그레이션."""
    migration_engine = create_db_engine(settings.database_url)
    with migration_engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=_use_batch,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
