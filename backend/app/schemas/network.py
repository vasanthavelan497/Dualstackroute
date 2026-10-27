from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class DeviceInterface(BaseModel):
    name: str = Field(..., description="Interface name (e.g., eth0)")
    ipv4_address: str = Field(..., description="IPv4 address with CIDR (e.g., 192.168.10.2/24)")
    ipv6_address: str = Field(..., description="IPv6 address with prefix (e.g., 2001:db8:10::2/64)")
    connected_link_id: Optional[str] = Field(None, description="Connected link ID")


class Device(BaseModel):
    id: str = Field(..., description="Unique node identifier (e.g., PC1, R1)")
    name: str = Field(..., description="Human-readable device name")
    type: Literal["host", "router"] = Field(..., description="Device role")
    description: str = Field(..., description="Role and interface description")
    primary_ipv4: str = Field(..., description="Primary IPv4 address")
    primary_ipv6: str = Field(..., description="Primary IPv6 address")
    position_x: float = Field(..., description="X coordinate for topology layout")
    position_y: float = Field(..., description="Y coordinate for topology layout")
    interfaces: List[DeviceInterface] = Field(default_factory=list)


class Link(BaseModel):
    id: str = Field(..., description="Unique link identifier (e.g., L1)")
    name: str = Field(..., description="Link name")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    latency: float = Field(..., ge=0.1, le=5000.0, description="One-way link latency in milliseconds")
    packet_loss: float = Field(..., ge=0.0, le=100.0, description="Link packet loss percentage (0-100)")
    bandwidth: float = Field(..., ge=1.0, le=100000.0, description="Link capacity in Mbps")
    cost: float = Field(default=1.0, ge=0.0, description="Administrative link weight/cost")
    status: Literal["up", "down"] = Field(default="up", description="Operational status: up or down")
    ipv4_subnet: str = Field(..., description="IPv4 point-to-point or segment subnet")
    ipv6_subnet: str = Field(..., description="IPv6 point-to-point or segment prefix")
    source_interface: str = Field(default="eth0", description="Source device interface name")
    target_interface: str = Field(default="eth1", description="Target device interface name")


class LinkUpdate(BaseModel):
    latency: Optional[float] = Field(None, ge=0.1, le=5000.0)
    packet_loss: Optional[float] = Field(None, ge=0.0, le=100.0)
    bandwidth: Optional[float] = Field(None, ge=1.0, le=100000.0)
    cost: Optional[float] = Field(None, ge=0.0)
    status: Optional[Literal["up", "down"]] = None


class NetworkTopology(BaseModel):
    devices: List[Device]
    links: List[Link]
    scenario_version: str = "1.0"
    total_devices: int
    total_links: int
    active_links: int
    connected_components: int = 1
