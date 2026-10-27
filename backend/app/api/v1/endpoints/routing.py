from fastapi import APIRouter
from backend.app.schemas.routing import RouteRequest, RouteResponse
from backend.app.services.routing_engine import RoutingEngine
from backend.app.services.topology_service import topology_service

router = APIRouter()


@router.post("/calculate", response_model=RouteResponse, summary="Evaluate and calculate optimal route under QoS constraints")
def calculate_route(request: RouteRequest):
    topology = topology_service.get_topology()
    return RoutingEngine.calculate_route(topology, request)
