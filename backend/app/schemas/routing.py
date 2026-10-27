from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class QoSConstraints(BaseModel):
    max_latency: Optional[float] = Field(None, ge=1.0, le=10000.0, description="Maximum permitted latency in ms")
    max_packet_loss: Optional[float] = Field(None, ge=0.0, le=100.0, description="Maximum permitted loss percentage")
    max_hops: Optional[int] = Field(None, ge=1, le=50, description="Maximum hop count")
    min_bandwidth: Optional[float] = Field(None, ge=1.0, le=100000.0, description="Minimum bottleneck bandwidth in Mbps")


class RouteWeights(BaseModel):
    latency_weight: float = Field(0.5, ge=0.0, le=100.0, description="Weight for aggregate latency")
    loss_weight: float = Field(20.0, ge=0.0, le=500.0, description="Weight for end-to-end packet loss percentage")
    hop_weight: float = Field(5.0, ge=0.0, le=100.0, description="Weight for hop count")


class RouteRequest(BaseModel):
    source: str = Field(default="PC1", description="Source node ID")
    destination: str = Field(default="PC2", description="Destination node ID")
    address_family: Literal["ipv4", "ipv6"] = Field(default="ipv4", description="Routing address family")
    constraints: Optional[QoSConstraints] = Field(default=None, description="QoS constraints to filter paths")
    weights: Optional[RouteWeights] = Field(default=None, description="Custom weights for cost evaluation")


class PathHop(BaseModel):
    from_node: str
    to_node: str
    link_id: str
    latency: float
    packet_loss: float
    bandwidth: float
    ipv4_subnet: str
    ipv6_subnet: str


class CandidatePath(BaseModel):
    path: List[str] = Field(..., description="Ordered list of device IDs")
    link_ids: List[str] = Field(..., description="Ordered list of traversed link IDs")
    hops: List[PathHop] = Field(default_factory=list)
    total_latency: float = Field(..., description="Sum of link latencies (ms)")
    end_to_end_loss: float = Field(..., description="Calculated end-to-end packet loss (%)")
    hop_count: int = Field(..., description="Number of hops (links traversed)")
    bottleneck_bandwidth: float = Field(..., description="Minimum link bandwidth on path (Mbps)")
    bottleneck_link_id: str = Field(..., description="ID of link with minimum bandwidth")
    calculated_cost: float = Field(..., description="Evaluated composite routing cost")
    is_feasible: bool = Field(..., description="Whether path satisfies all QoS constraints")
    rejection_reasons: List[str] = Field(default_factory=list)


class RouteResponse(BaseModel):
    source: str
    destination: str
    address_family: Literal["ipv4", "ipv6"]
    selected_route: Optional[CandidatePath] = None
    alternative_routes: List[CandidatePath] = Field(default_factory=list)
    rejected_routes: List[CandidatePath] = Field(default_factory=list)
    destination_reachable: bool = True
    feasible_path_count: int = 0
    total_paths_evaluated: int = 0
    selection_explanation: str
    relaxation_suggestion: Optional[str] = None
    applied_constraints: Optional[QoSConstraints] = None
    applied_weights: RouteWeights
