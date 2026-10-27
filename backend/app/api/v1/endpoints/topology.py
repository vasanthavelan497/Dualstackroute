from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.network import Device, Link, LinkUpdate, NetworkTopology
from backend.app.services.topology_service import topology_service

router = APIRouter()


@router.get("", response_model=NetworkTopology, summary="Retrieve active network topology")
def get_topology():
    return topology_service.get_topology()


@router.get("/devices/{device_id}", response_model=Device, summary="Retrieve device details")
def get_device(device_id: str):
    device = topology_service.get_device(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with ID '{device_id}' was not found in topology."
        )
    return device


@router.get("/links/{link_id}", response_model=Link, summary="Retrieve link details")
def get_link(link_id: str):
    link = topology_service.get_link(link_id)
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' was not found in topology."
        )
    return link


@router.patch("/links/{link_id}", response_model=Link, summary="Update link metrics or operational status")
def update_link(link_id: str, update: LinkUpdate):
    updated = topology_service.update_link(link_id, update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' was not found in topology."
        )
    return updated


@router.post("/links/{link_id}/fail", response_model=Link, summary="Simulate link failure")
def fail_link(link_id: str):
    failed = topology_service.fail_link(link_id)
    if not failed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' was not found."
        )
    return failed


@router.post("/links/{link_id}/restore", response_model=Link, summary="Restore failed link")
def restore_link(link_id: str):
    restored = topology_service.restore_link(link_id)
    if not restored:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Link with ID '{link_id}' was not found."
        )
    return restored


@router.post("/reset", response_model=NetworkTopology, summary="Reset topology to default baseline")
def reset_scenario():
    return topology_service.reset_scenario()
