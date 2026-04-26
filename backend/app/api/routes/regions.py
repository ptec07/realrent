from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.region import RegionSearchResponse
from app.services.region_search_service import search_regions

router = APIRouter(prefix="/api/regions", tags=["Regions"])


@router.get("", response_model=RegionSearchResponse, response_model_by_alias=True)
def list_regions(
    q: str = Query(..., description="지역 검색어"),
    db: Session = Depends(get_db),
) -> RegionSearchResponse:
    return RegionSearchResponse(items=search_regions(db, q))
