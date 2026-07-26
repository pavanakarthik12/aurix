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

    # Grok (xAI) — Primary LLM Provider
    GROK_API_KEY: str = ""
    GROK_API_BASE: str = "https://api.x.ai/v1"
    GROK_MODEL: str = "grok-beta"
    GROK_TIMEOUT: int = 60
    GROK_MAX_RETRIES: int = 3
    GROK_TEMPERATURE: float = 0.7
    GROK_MAX_TOKENS: int = 2048

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # OCR
    TESSERACT_PATH: str = "/usr/bin/tesseract"

    # RAG
    CHROMA_DB_PATH: str = "./data/chromadb"

    # Upload
    UPLOAD_FOLDER: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 20 * 1024 * 1024

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
