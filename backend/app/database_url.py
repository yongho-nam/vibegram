"""DATABASE_URL 조합·정규화 (SQLite / PostgreSQL)."""

from __future__ import annotations

from urllib.parse import quote_plus

PRODUCTION_ENVS = frozenset({"production", "prod"})


def normalize_database_url(url: str) -> str:
    """Heroku 스타일 `postgres://` 및 드라이버 없는 `postgresql://` 를 psycopg3 URL로 통일."""
    url = url.strip()
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]
    if url.startswith("postgresql://") and "+psycopg" not in url.split("://", 1)[0]:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def build_postgres_url(
    *,
    user: str,
    password: str,
    host: str,
    port: int,
    database: str,
) -> str:
    user_q = quote_plus(user)
    if password:
        auth = f"{user_q}:{quote_plus(password)}"
    else:
        auth = user_q
    db_q = quote_plus(database)
    return f"postgresql+psycopg://{auth}@{host}:{port}/{db_q}"


def resolve_database_url(
    *,
    app_env: str,
    explicit_url: str | None,
    postgres_user: str,
    postgres_password: str,
    postgres_host: str,
    postgres_port: int,
    postgres_db: str,
    sqlite_default: str = "sqlite:///./instagram.db",
) -> str:
    """명시적 DATABASE_URL 우선, 없으면 APP_ENV 로 SQLite / PostgreSQL 선택."""
    if explicit_url and explicit_url.strip():
        return normalize_database_url(explicit_url.strip())
    if app_env.lower() in PRODUCTION_ENVS:
        return build_postgres_url(
            user=postgres_user,
            password=postgres_password,
            host=postgres_host,
            port=postgres_port,
            database=postgres_db,
        )
    return sqlite_default


def is_sqlite_url(url: str) -> bool:
    return url.startswith("sqlite")


def is_postgresql_url(url: str) -> bool:
    return url.startswith("postgresql")
