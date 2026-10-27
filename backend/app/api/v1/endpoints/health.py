from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Service health check")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "NetworkX + Python ipaddress",
        "database": "SQLite"
    }
