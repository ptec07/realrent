from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import HousingType, RentType
from app.schemas.transaction import TransactionSearchResponse
from app.services.transaction_query_service import search_transactions

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionSearchResponse, response_model_by_alias=True)
def list_transactions(
    region_code_5: str = Query(..., alias="regionCode5", description="5자리 법정동 시군구 코드"),
    dong: str | None = Query(default=None),
    source_type: HousingType | None = Query(default=None, alias="sourceType"),
    rent_type: RentType | Literal["all"] | None = Query(default=None, alias="rentType"),
    deposit_max: int | None = Query(default=None, alias="depositMax", ge=0),
    monthly_rent_max: int | None = Query(default=None, alias="monthlyRentMax", ge=0),
    area_min: float | None = Query(default=None, alias="areaMin", ge=0),
    area_max: float | None = Query(default=None, alias="areaMax", ge=0),
    sort: Literal["latest", "deposit_asc", "monthly_rent_asc"] = Query(default="latest"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    db: Session = Depends(get_db),
) -> TransactionSearchResponse:
    result = search_transactions(
        db,
        region_code_5=region_code_5,
        dong=dong,
        source_type=source_type,
        rent_type=rent_type,
        deposit_max=deposit_max,
        monthly_rent_max=monthly_rent_max,
        area_min=area_min,
        area_max=area_max,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return TransactionSearchResponse(items=result.items, page=result.page, page_size=result.page_size, total=result.total)
