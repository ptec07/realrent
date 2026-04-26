from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import HousingType, RentType
from app.schemas.summary import SummaryResponse
from app.services.summary_service import get_region_summary

router = APIRouter(prefix="/api/summary", tags=["Summary"])


@router.get("", response_model=SummaryResponse, response_model_by_alias=True)
def get_summary(
    region_code_5: str = Query(..., alias="regionCode5", description="5자리 법정동 시군구 코드"),
    dong: str | None = Query(default=None),
    source_type: HousingType | None = Query(default=None, alias="sourceType"),
    rent_type: RentType | Literal["all"] | None = Query(default=None, alias="rentType"),
    months: int = Query(default=12, ge=1, le=120),
    db: Session = Depends(get_db),
) -> SummaryResponse:
    summary = get_region_summary(
        db,
        region_code_5=region_code_5,
        dong=dong,
        source_type=source_type,
        rent_type=rent_type,
        months=months,
    )
    return SummaryResponse(
        region_code_5=summary.region_code_5,
        source_type=summary.source_type,
        rent_type=summary.rent_type,
        months=summary.months,
        transaction_count=summary.transaction_count,
        avg_deposit_manwon=summary.avg_deposit_manwon,
        avg_monthly_rent_manwon=summary.avg_monthly_rent_manwon,
        avg_area_m2=summary.avg_area_m2,
        latest_month=summary.latest_month,
        sample_warning=summary.sample_warning,
    )
