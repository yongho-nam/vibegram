"""DATABASE_URL 자동 선택 단위 테스트."""

from __future__ import annotations

import os

import pytest

from app.database_url import build_postgres_url, normalize_database_url, resolve_database_url


def test_development_defaults_to_sqlite() -> None:
    url = resolve_database_url(
        app_env="development",
        explicit_url=None,
        postgres_user="u",
        postgres_password="p",
        postgres_host="h",
        postgres_port=5432,
        postgres_db="d",
    )
    assert url == "sqlite:///./instagram.db"


def test_production_builds_postgres_url() -> None:
    url = resolve_database_url(
        app_env="production",
        explicit_url=None,
        postgres_user="ig",
        postgres_password="secret",
        postgres_host="db.internal",
        postgres_port=5432,
        postgres_db="instagram",
    )
    assert url.startswith("postgresql+psycopg://")
    assert "ig" in url
    assert "db.internal" in url


def test_explicit_database_url_wins() -> None:
    url = resolve_database_url(
        app_env="production",
        explicit_url="sqlite:///./custom.db",
        postgres_user="u",
        postgres_password="p",
        postgres_host="h",
        postgres_port=5432,
        postgres_db="d",
    )
    assert url == "sqlite:///./custom.db"


def test_normalize_postgres_scheme() -> None:
    assert normalize_database_url("postgres://u:p@host/db").startswith("postgresql+psycopg://")
    assert normalize_database_url("postgresql://u:p@host/db").startswith("postgresql+psycopg://")


def test_settings_production_without_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("POSTGRES_USER", "app")
    monkeypatch.setenv("POSTGRES_PASSWORD", "pw")
    monkeypatch.setenv("POSTGRES_HOST", "localhost")
    monkeypatch.setenv("POSTGRES_PORT", "5432")
    monkeypatch.setenv("POSTGRES_DB", "ig")

    s = Settings(_env_file=None)
    assert s.is_postgresql
    assert s.database_url.startswith("postgresql+psycopg://")
