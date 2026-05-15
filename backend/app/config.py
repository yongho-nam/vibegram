from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./instagram.db"
    jwt_secret: str = "change-me-in-development-32bytes!!"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7  # 7 days demo
    upload_dir: str = "./uploads"
    frontend_origin: str = "http://localhost:5173"
    """JSON에 넣는 미디어·아바타 절대 URL의 호스트(끝에 / 없음)."""
    api_public_base: str = "http://localhost:8000"
    """비밀번호 재설정: True면 API 응답에 재설정 URL을 포함(데모·로컬). 운영에서는 False로 두고 메일 발송 등으로 대체."""
    expose_password_reset_link: bool = True


settings = Settings()
