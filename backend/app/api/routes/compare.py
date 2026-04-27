from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import HousingType, RentType
from app.schemas.compare import CompareResponse
from app.services.compare_service import compare_regions

router = APIRouter(prefix="/api/compare", tags=["Compare"])


@router.get("", response_model=CompareResponse, response_model_by_alias=True)
def compare(
    region_a: str = Query(..., alias="regionA", description="비교 기준 A 지역의 5자리 법정동 시군구 코드"),
    region_b: str = Query(..., alias="regionB", description="비교 대상 B 지역의 5자리 법정동 시군구 코드"),
    dong_a: str | None = Query(default=None, alias="dongA"),
    dong_b: str | None = Query(default=None, alias="dongB"),
    source_type: HousingType | None = Query(default=None, alias="sourceType"),
    rent_type: RentType | Literal["all"] | None = Query(default=None, alias="rentType"),
    months: int = Query(default=12, ge=1, le=120),
    db: Session = Depends(get_db),
) -> CompareResponse:
    result = compare_regions(
        db,
        region_a=region_a,
        region_b=region_b,
        dong_a=dong_a,
        dong_b=dong_b,
        source_type=source_type,
        rent_type=rent_type,
        months=months,
    )
    return CompareResponse(
        region_a=result.region_a,
        region_b=result.region_b,
        diff=result.diff,
        insight=result.insight,
    )
