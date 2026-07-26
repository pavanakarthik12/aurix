from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.api.health import router as health_router, set_grok_status, set_db_status
from app.api.ai import router as ai_router
from app.api.ocr import router as ocr_router
from app.rag.api import router as rag_router
from app.core.config import settings
from app.core.exceptions import AurixException, aurix_exception_handler, global_exception_handler
from app.core.logging import setup_logging
from app.core.startup import run_startup_validation


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"AI Provider: Grok ({settings.GROK_MODEL})")

    results = await run_startup_validation()

    set_grok_status(results.get("grok", False))
    set_db_status(results.get("database", False))

    if not results.get("environment"):
        logger.warning("GROK_API_KEY is missing — AI features will not work until it is configured")

    yield

    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AurixException, aurix_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.include_router(health_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(ocr_router, prefix="/api/v1")
app.include_router(rag_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"service": settings.APP_NAME, "version": settings.VERSION, "status": "operational"}
