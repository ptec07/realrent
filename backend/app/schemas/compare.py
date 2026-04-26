from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CompareRegionSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    region_code_5: str = Field(serialization_alias="regionCode5")
    transaction_count: int = Field(serialization_alias="transactionCount")
    avg_deposit_manwon: int | None = Field(default=None, serialization_alias="avgDepositManwon")
    avg_monthly_rent_manwon: int | None = Field(default=None, serialization_alias="avgMonthlyRentManwon")
    avg_area_m2: Decimal | None = Field(default=None, serialization_alias="avgAreaM2")
    latest_month: str | None = Field(default=None, serialization_alias="latestMonth")


class CompareDiffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    deposit_manwon: int | None = Field(default=None, serialization_alias="depositManwon")
    monthly_rent_manwon: int | None = Field(default=None, serialization_alias="monthlyRentManwon")


class CompareResponse(BaseModel):
    region_a: CompareRegionSummaryResponse = Field(serialization_alias="regionA")
    region_b: CompareRegionSummaryResponse = Field(serialization_alias="regionB")
    diff: CompareDiffResponse
    insight: str
