from fastapi import APIRouter
from loguru import logger

from app.ai.grok import GrokProvider
from app.core.config import settings
from app.database.session import engine

router = APIRouter(tags=["Health"])

_grok_status: str = "unknown"
_grok_message: str = ""
_db_status: str = "unknown"


def set_grok_status(connected: bool, message: str = ""):
    global _grok_status, _grok_message
    _grok_status = "connected" if connected else "disconnected"
    _grok_message = message


def set_db_status(connected: bool, message: str = ""):
    global _db_status
    _db_status = "connected" if connected else "disconnected"


@router.get("/health")
async def health_check():
    import asyncio
    from sqlalchemy import text

    db_ok = False
    grok_ok = False

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
        set_db_status(True)
    except Exception as e:
        set_db_status(False, str(e))

    try:
        provider = GrokProvider()
        grok_ok = await provider.verify_connection()
        await provider.close()
        set_grok_status(grok_ok)
    except Exception as e:
        set_grok_status(False, str(e))

    return {
        "status": "healthy" if db_ok else "degraded",
        "version": settings.VERSION,
        "service": settings.APP_NAME,
        "backend": "healthy",
        "database": _db_status,
        "grok": _grok_status,
        "grok_message": _grok_message if _grok_status == "disconnected" else "",
    }
