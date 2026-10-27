from fastapi import APIRouter
from backend.app.schemas.ip_validation import IPValidationRequest, IPValidationResponse
from backend.app.services.ip_validator import IPValidatorService

router = APIRouter()


@router.post("/validate", response_model=IPValidationResponse, summary="Validate IPv4 or IPv6 address or CIDR prefix")
def validate_ip(request: IPValidationRequest):
    return IPValidatorService.validate_ip_or_prefix(
        input_value=request.address,
        expected_version=request.expected_version
    )
