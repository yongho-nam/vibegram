from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.database_url import is_postgresql_url, is_sqlite_url, resolve_database_url

AppEnv = Literal["development", "production", "test"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: AppEnv = Field(default="development", validation_alias="APP_ENV")

    database_url: str | None = Field(default=None, validation_alias="DATABASE_URL")

    postgres_user: str = Field(default="instagram", validation_alias="POSTGRES_USER")
    postgres_password: str = Field(default="", validation_alias="POSTGRES_PASSWORD")
    postgres_host: str = Field(default="localhost", validation_alias="POSTGRES_HOST")
    postgres_port: int = Field(default=5432, validation_alias="POSTGRES_PORT")
    postgres_db: str = Field(default="instagram", validation_alias="POSTGRES_DB")

    jwt_secret: str = "change-me-in-development-32bytes!!"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7  # 7 days demo
    upload_dir: str = "./uploads"
    frontend_origin: str = "http://localhost:5173"
    """JSON에 넣는 미디어·아바타 절대 URL의 호스트(끝에 / 없음)."""
    api_public_base: str = "http://localhost:8000"
    """비밀번호 재설정: True면 API 응답에 재설정 URL을 포함(데모·로컬). 운영에서는 False로 두고 메일 발송 등으로 대체."""
    expose_password_reset_link: bool = True

    @model_validator(mode="after")
    def _resolve_database_url(self) -> Settings:
        self.database_url = resolve_database_url(
            app_env=self.app_env,
            explicit_url=self.database_url,
            postgres_user=self.postgres_user,
            postgres_password=self.postgres_password,
            postgres_host=self.postgres_host,
            postgres_port=self.postgres_port,
            postgres_db=self.postgres_db,
        )
        return self

    @property
    def is_sqlite(self) -> bool:
        assert self.database_url is not None
        return is_sqlite_url(self.database_url)

    @property
    def is_postgresql(self) -> bool:
        assert self.database_url is not None
        return is_postgresql_url(self.database_url)


settings = Settings()
