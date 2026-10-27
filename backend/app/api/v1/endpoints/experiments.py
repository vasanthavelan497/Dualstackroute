from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.experiment import (
    ExperimentCreate,
    ExperimentDetail,
    ExperimentListItem,
    ExperimentCompareRequest,
    ExperimentCompareResponse,
)
from backend.app.services.experiment_service import ExperimentService

router = APIRouter()


@router.get("", response_model=List[ExperimentListItem], summary="List persisted experiments")
def list_experiments(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    return ExperimentService.list_experiments(db, category=category, search=search, limit=limit)


@router.post("", response_model=ExperimentDetail, status_code=status.HTTP_201_CREATED, summary="Create and persist an experiment")
def create_experiment(
    experiment_in: ExperimentCreate,
    db: Session = Depends(get_db)
):
    return ExperimentService.create_experiment(db, experiment_in)


@router.get("/export/csv", summary="Export experiments as CSV")
def export_csv(db: Session = Depends(get_db)):
    csv_content = ExperimentService.export_csv(db)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dualstackroute_experiments.csv"}
    )


@router.post("/compare", response_model=ExperimentCompareResponse, summary="Compare multiple experiments side-by-side")
def compare_experiments(
    req: ExperimentCompareRequest,
    db: Session = Depends(get_db)
):
    return ExperimentService.compare_experiments(db, req.experiment_ids)


@router.get("/{experiment_id}", response_model=ExperimentDetail, summary="Retrieve experiment details")
def get_experiment(
    experiment_id: str,
    db: Session = Depends(get_db)
):
    exp = ExperimentService.get_experiment(db, experiment_id)
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{experiment_id}' was not found."
        )
    return exp


@router.delete("/{experiment_id}", summary="Delete an experiment record")
def delete_experiment(
    experiment_id: str,
    db: Session = Depends(get_db)
):
    success = ExperimentService.delete_experiment(db, experiment_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{experiment_id}' was not found."
        )
    return {"message": "Experiment deleted successfully", "id": experiment_id}


@router.delete("", summary="Clear all experiment history")
def clear_all(db: Session = Depends(get_db)):
    count = ExperimentService.clear_all(db)
    return {"message": f"Successfully cleared {count} experiment records."}
