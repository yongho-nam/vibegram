from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings
from app.database_url import is_sqlite_url


class Base(DeclarativeBase):
    pass


def create_db_engine(url: str) -> Engine:
    """SQLite(로컬) / PostgreSQL(서버) 공통 Engine 팩토리."""
    connect_args: dict = {}
    engine_kwargs: dict = {}

    if is_sqlite_url(url):
        connect_args["check_same_thread"] = False
        connect_args["timeout"] = 30
    else:
        engine_kwargs["pool_pre_ping"] = True

    eng = create_engine(url, connect_args=connect_args, **engine_kwargs)

    if is_sqlite_url(url):

        @event.listens_for(eng, "connect")
        def _sqlite_pragma(dbapi_connection, _connection_record) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    return eng


engine = create_db_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
