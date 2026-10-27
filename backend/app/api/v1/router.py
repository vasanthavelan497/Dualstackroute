from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    health,
    topology,
    routing,
    ip,
    experiments,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(topology.router, prefix="/topology", tags=["Topology"])
api_router.include_router(routing.router, prefix="/routing", tags=["Routing Engine"])
api_router.include_router(ip.router, prefix="/ip", tags=["Dual-Stack IP & Addressing"])
api_router.include_router(experiments.router, prefix="/experiments", tags=["Experiments"])
