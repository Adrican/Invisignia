from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    secret_key: str = os.getenv("SECRET_KEY", "fallback-secret-key-for-dev")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = os.getenv("DATABASE_URL", "postgresql://localhost/invisignia")
    environment: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"

settings = Settings()