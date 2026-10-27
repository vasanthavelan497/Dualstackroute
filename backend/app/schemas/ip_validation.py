from typing import Optional, Literal
from pydantic import BaseModel, Field


class IPValidationRequest(BaseModel):
    address: str = Field(..., description="IP address or CIDR prefix to validate")
    expected_version: Optional[Literal[4, 6]] = Field(None, description="Expected IP version (4 or 6) if enforcing")


class IPValidationResponse(BaseModel):
    input_value: str
    is_valid: bool
    version: Optional[int] = None
    is_network_prefix: bool = False
    ip_address: Optional[str] = None
    prefix_length: Optional[int] = None
    netmask: Optional[str] = None
    network_address: Optional[str] = None
    broadcast_address: Optional[str] = None
    total_hosts: Optional[int] = None
    is_private: bool = False
    is_global: bool = False
    is_loopback: bool = False
    is_link_local: bool = False
    is_reserved: bool = False
    details: str
    error_message: Optional[str] = None
