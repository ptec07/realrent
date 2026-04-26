from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import HousingType, RentType

TrendRentType = RentType | Literal["all"]


class TrendPointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    month: str
    transaction_count: int = Field(serialization_alias="transactionCount")
    avg_deposit_manwon: int | None = Field(default=None, serialization_alias="avgDepositManwon")
    avg_monthly_rent_manwon: int | None = Field(default=None, serialization_alias="avgMonthlyRentManwon")
    avg_area_m2: Decimal | None = Field(default=None, serialization_alias="avgAreaM2")


class TrendResponse(BaseModel):
    region_code_5: str = Field(serialization_alias="regionCode5")
    source_type: HousingType | None = Field(default=None, serialization_alias="sourceType")
    rent_type: TrendRentType | None = Field(default=None, serialization_alias="rentType")
    months: int
    points: list[TrendPointResponse]
