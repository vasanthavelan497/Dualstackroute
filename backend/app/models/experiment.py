import datetime
import uuid
from sqlalchemy import Column, String, DateTime, Text, Float, Boolean, Integer
from backend.app.database.base import Base


class ExperimentModel(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)
    name = Column(String(128), nullable=False)
    category = Column(String(64), default="routing_lab", nullable=False)
    address_family = Column(String(8), default="ipv4", nullable=False)
    source = Column(String(32), nullable=False)
    destination = Column(String(32), nullable=False)
    
    # Selected route summary metrics
    path_nodes = Column(String(256), nullable=True) # e.g. "PC1 -> R1 -> R2 -> R4 -> PC2"
    hop_count = Column(Integer, nullable=True)
    total_latency = Column(Float, nullable=True)
    end_to_end_loss = Column(Float, nullable=True)
    bottleneck_bandwidth = Column(Float, nullable=True)
    calculated_cost = Column(Float, nullable=True)
    destination_reachable = Column(Boolean, default=True, nullable=False)
    is_qos_compliant = Column(Boolean, default=True, nullable=False)

    # Detailed serialized JSON snapshots
    topology_snapshot = Column(Text, nullable=False) # JSON
    qos_constraints = Column(Text, nullable=True)    # JSON
    selected_route_json = Column(Text, nullable=True)# JSON
    candidate_routes_json = Column(Text, nullable=True) # JSON
    before_metrics = Column(Text, nullable=True)     # JSON (for fail/recover comparative experiments)
    after_metrics = Column(Text, nullable=True)      # JSON
    event_timeline = Column(Text, nullable=True)     # JSON list of events
    summary_explanation = Column(Text, nullable=False)
