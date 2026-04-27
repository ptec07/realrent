from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.region import RegionHierarchyResponse, RegionSearchResponse
from app.services.region_search_service import list_region_hierarchy, search_regions

router = APIRouter(prefix="/api/regions", tags=["Regions"])


@router.get("/hierarchy", response_model=RegionHierarchyResponse, response_model_by_alias=True)
def region_hierarchy(
    sido: str | None = Query(default=None, description="선택한 특별시·광역시·도"),
    sigungu: str | None = Query(default=None, description="선택한 시군구"),
    db: Session = Depends(get_db),
) -> RegionHierarchyResponse:
    sidos, sigungus, dongs = list_region_hierarchy(db, sido=sido, sigungu=sigungu)
    return RegionHierarchyResponse(sidos=sidos, sigungus=sigungus, dongs=dongs)


@router.get("", response_model=RegionSearchResponse, response_model_by_alias=True)
def list_regions(
    q: str = Query(..., description="지역 검색어"),
    db: Session = Depends(get_db),
) -> RegionSearchResponse:
    return RegionSearchResponse(items=search_regions(db, q))
