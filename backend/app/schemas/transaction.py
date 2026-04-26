from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import HousingType, RentType


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    source_type: HousingType = Field(serialization_alias="sourceType")
    rent_type: RentType = Field(serialization_alias="rentType")
    region_sido: str = Field(serialization_alias="regionSido")
    region_sigungu: str = Field(serialization_alias="regionSigungu")
    region_dong: str | None = Field(default=None, serialization_alias="regionDong")
    region_code_5: str = Field(serialization_alias="regionCode5")
    building_name: str = Field(serialization_alias="buildingName")
    address_jibun: str | None = Field(default=None, serialization_alias="addressJibun")
    area_m2: Decimal = Field(serialization_alias="areaM2")
    floor: int | None = None
    built_year: int | None = Field(default=None, serialization_alias="builtYear")
    contract_date: date = Field(serialization_alias="contractDate")
    contract_year_month: str = Field(serialization_alias="contractYearMonth")
    deposit_amount_manwon: int = Field(serialization_alias="depositAmountManwon")
    monthly_rent_manwon: int = Field(serialization_alias="monthlyRentManwon")


class TransactionSearchResponse(BaseModel):
    items: list[TransactionResponse]
    page: int
    page_size: int = Field(serialization_alias="pageSize")
    total: int
