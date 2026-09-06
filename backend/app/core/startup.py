import asyncio
import shutil
from pathlib import Path

from loguru import logger
from sqlalchemy import text

from app.ai.groq import GroqProvider
from app.core.config import settings
from app.database.session import engine


async def verify_groq() -> bool:
    provider = GroqProvider()
    try:
        return await provider.verify_connection()
    finally:
        await provider.close()


async def verify_database() -> bool:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.success("✓ Database Connected Successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Database Connection Failed: {e}")
        return False


def verify_tesseract() -> bool:
    tesseract_path = settings.TESSERACT_PATH
    if tesseract_path and Path(tesseract_path).exists():
        logger.success(f"✓ Tesseract Found: {tesseract_path}")
        return True
    logger.warning(f"✗ Tesseract Not Found at: {tesseract_path} — OCR features will be unavailable")
    return False


def verify_upload_directory() -> bool:
    path = Path(settings.UPLOAD_FOLDER)
    try:
        path.mkdir(parents=True, exist_ok=True)
        logger.success(f"✓ Upload Directory Ready: {path.absolute()}")
        return True
    except Exception as e:
        logger.error(f"✗ Upload Directory Failed: {e}")
        return False


def verify_chroma_path() -> bool:
    path = Path(settings.CHROMA_DB_PATH)
    try:
        path.mkdir(parents=True, exist_ok=True)
        logger.success(f"✓ ChromaDB Path Ready: {path.absolute()}")
        return True
    except Exception as e:
        logger.error(f"✗ ChromaDB Path Failed: {e}")
        return False


def verify_redis() -> bool:
    if settings.REDIS_URL and settings.REDIS_URL != "redis://localhost:6379/0":
        logger.info("Redis configured — will connect on first use")
        return True
    logger.info("Redis not configured — task queue features will be unavailable")
    return False


async def run_startup_validation() -> dict[str, str | bool]:
    logger.info("=" * 50)
    logger.info("Aurix Startup Validation")
    logger.info("=" * 50)

    if settings.GROQ_API_KEY:
        logger.info("✓ GROQ_API_KEY found in .env")
    else:
        logger.error("✗ GROQ_API_KEY is missing from .env — AI features will fail")

    results = {
        "environment": bool(settings.GROQ_API_KEY),
        "database": False,
        "groq": False,
        "tesseract": verify_tesseract(),
        "upload_directory": verify_upload_directory(),
        "chroma_path": verify_chroma_path(),
        "redis": verify_redis(),
    }

    db_task = asyncio.create_task(verify_database())
    groq_task = asyncio.create_task(verify_groq())

    results["database"] = await db_task
    results["groq"] = await groq_task

    logger.info("=" * 50)
    for name, status in results.items():
        icon = "✓" if status else "✗"
        logger.info(f"  {icon} {name}: {status}")
    logger.info("=" * 50)

    return results
