from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.models.enums import HousingType, RentType

SummaryRentType = RentType | Literal["all"]


class SummaryResponse(BaseModel):
    region_code_5: str = Field(serialization_alias="regionCode5")
    source_type: HousingType | None = Field(default=None, serialization_alias="sourceType")
    rent_type: SummaryRentType | None = Field(default=None, serialization_alias="rentType")
    months: int
    transaction_count: int = Field(serialization_alias="transactionCount")
    avg_deposit_manwon: int | None = Field(default=None, serialization_alias="avgDepositManwon")
    avg_monthly_rent_manwon: int | None = Field(default=None, serialization_alias="avgMonthlyRentManwon")
    avg_area_m2: Decimal | None = Field(default=None, serialization_alias="avgAreaM2")
    latest_month: str | None = Field(default=None, serialization_alias="latestMonth")
    sample_warning: str | None = Field(default=None, serialization_alias="sampleWarning")
