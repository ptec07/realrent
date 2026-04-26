from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import HousingType, RentType
from app.schemas.trend import TrendResponse
from app.services.trend_service import get_region_trend

router = APIRouter(prefix="/api/trends", tags=["Trends"])


@router.get("", response_model=TrendResponse, response_model_by_alias=True)
def get_trends(
    region_code_5: str = Query(..., alias="regionCode5", description="5자리 법정동 시군구 코드"),
    dong: str | None = Query(default=None),
    source_type: HousingType | None = Query(default=None, alias="sourceType"),
    rent_type: RentType | Literal["all"] | None = Query(default=None, alias="rentType"),
    months: int = Query(default=12, ge=1, le=120),
    db: Session = Depends(get_db),
) -> TrendResponse:
    trend = get_region_trend(
        db,
        region_code_5=region_code_5,
        dong=dong,
        source_type=source_type,
        rent_type=rent_type,
        months=months,
    )
    return TrendResponse(
        region_code_5=trend.region_code_5,
        source_type=trend.source_type,
        rent_type=trend.rent_type,
        months=trend.months,
        points=trend.points,
    )
