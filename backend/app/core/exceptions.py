from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from loguru import logger


class AurixException(Exception):
    def __init__(self, message: str, status_code: int = 500, detail: dict | None = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}
        super().__init__(self.message)


class NotFoundException(AurixException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(message=f"{resource} not found", status_code=404)


class ValidationException(AurixException):
    def __init__(self, message: str = "Validation error", detail: dict | None = None):
        super().__init__(message=message, status_code=422, detail=detail or {})


class UnauthorizedException(AurixException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message=message, status_code=401)


async def aurix_exception_handler(request: Request, exc: AurixException):
    logger.error(f"{exc.message} | path={request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "detail": exc.detail, "path": str(request.url.path)},
    )


async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception | path={request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "path": str(request.url.path)},
    )
