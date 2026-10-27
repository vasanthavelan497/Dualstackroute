from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
import datetime


class SimulationEvent(BaseModel):
    timestamp: str
    event_type: str
    target_id: Optional[str] = None
    description: str
    impact_summary: Optional[str] = None


class ExperimentCreate(BaseModel):
    name: str = Field(..., max_length=128)
    category: str = Field(default="routing_lab")
    address_family: str = Field(default="ipv4")
    source: str = Field(default="PC1")
    destination: str = Field(default="PC2")
    topology_snapshot: Dict[str, Any]
    qos_constraints: Optional[Dict[str, Any]] = None
    selected_route: Optional[Dict[str, Any]] = None
    candidate_routes: Optional[List[Dict[str, Any]]] = None
    before_metrics: Optional[Dict[str, Any]] = None
    after_metrics: Optional[Dict[str, Any]] = None
    event_timeline: Optional[List[SimulationEvent]] = None
    summary_explanation: str


class ExperimentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime.datetime
    name: str
    category: str
    address_family: str
    source: str
    destination: str
    path_nodes: Optional[str] = None
    hop_count: Optional[int] = None
    total_latency: Optional[float] = None
    end_to_end_loss: Optional[float] = None
    bottleneck_bandwidth: Optional[float] = None
    calculated_cost: Optional[float] = None
    destination_reachable: bool
    is_qos_compliant: bool
    summary_explanation: str


class ExperimentDetail(ExperimentListItem):
    topology_snapshot: Dict[str, Any]
    qos_constraints: Optional[Dict[str, Any]] = None
    selected_route_json: Optional[Dict[str, Any]] = None
    candidate_routes_json: Optional[List[Dict[str, Any]]] = None
    before_metrics: Optional[Dict[str, Any]] = None
    after_metrics: Optional[Dict[str, Any]] = None
    event_timeline: Optional[List[SimulationEvent]] = None


class ExperimentCompareRequest(BaseModel):
    experiment_ids: List[str] = Field(..., min_length=2, max_length=6)


class MetricComparison(BaseModel):
    experiment_id: str
    name: str
    category: str
    address_family: str
    path_nodes: Optional[str] = None
    total_latency: Optional[float] = None
    end_to_end_loss: Optional[float] = None
    hop_count: Optional[int] = None
    bottleneck_bandwidth: Optional[float] = None
    calculated_cost: Optional[float] = None
    destination_reachable: bool
    is_qos_compliant: bool


class ExperimentCompareResponse(BaseModel):
    items: List[MetricComparison]
    analysis_insights: List[str]
