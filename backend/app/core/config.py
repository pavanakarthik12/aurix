from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Aurix API"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "change-this-in-production"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/aurix"

    # Groq API — Primary LLM Provider (Groq, not Grok/xAI)
    GROQ_API_KEY: str = ""
    GROQ_API_BASE: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TIMEOUT: int = 60
    GROQ_MAX_RETRIES: int = 3
    GROQ_TEMPERATURE: float = 0.7
    GROQ_MAX_TOKENS: int = 2048

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OCR
    TESSERACT_PATH: str = "/usr/bin/tesseract"

    # RAG
    CHROMA_DB_PATH: str = "./data/chromadb"

    # Upload
    UPLOAD_FOLDER: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024

    # CORS - Parse comma-separated origins from environment
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("MAX_UPLOAD_SIZE", mode="before")
    @classmethod
    def _coerce_empty_upload_size(cls, value):
        if value in (None, ""):
            return 20 * 1024 * 1024
        return value

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
