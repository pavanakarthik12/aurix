from fastapi import APIRouter
from loguru import logger

from app.ai.groq import GroqProvider
from app.core.config import settings
from app.database.session import engine

router = APIRouter(tags=["Health"])

_groq_status: str = "unknown"
_groq_message: str = ""
_db_status: str = "unknown"


def set_groq_status(connected: bool, message: str = ""):
    global _groq_status, _groq_message
    _groq_status = "connected" if connected else "disconnected"
    _groq_message = message


def set_db_status(connected: bool, message: str = ""):
    global _db_status
    _db_status = "connected" if connected else "disconnected"


@router.get("/health")
async def health_check():
    import asyncio
    from sqlalchemy import text

    db_ok = False
    groq_ok = False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
        set_db_status(True)
    except Exception as e:
        set_db_status(False, str(e))

    try:
        provider = GroqProvider()
        groq_ok = await provider.verify_connection()
        await provider.close()
        set_groq_status(groq_ok)
    except Exception as e:
        set_groq_status(False, str(e))

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.VERSION,
        "service": settings.APP_NAME,
        "backend": "healthy",
        "database": _db_status,
        "groq": _groq_status,
        "groq_message": _groq_message if _groq_status == "disconnected" else "",
    }
