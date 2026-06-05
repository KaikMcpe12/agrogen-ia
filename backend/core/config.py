from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "production"
    ALLOWED_ORIGINS: List[str] = []
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    IA_SERVICE_URL: str = ""           # vazio = usa motor local diretamente
    IA_SERVICE_TIMEOUT_MS: int = 800

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()