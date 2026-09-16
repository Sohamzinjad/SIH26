import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "SIH26155 Network Security Compliance Auditor"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    
    # Neon PostgreSQL by default with automatic fallback logic in database.py
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_cl1pStId8FZP@ep-divine-butterfly-b5cb9bp6-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./auditor.db"
    
    # Ollama Local AI Configuration (NTRO air-gapped environment)
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
    OLLAMA_TIMEOUT_SECONDS: int = 45
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
