from pydantic import BaseModel, ConfigDict, Field


class RegionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    full_name: str = Field(serialization_alias="fullName")
    sido_name: str = Field(serialization_alias="sido")
    sigungu_name: str = Field(serialization_alias="sigungu")
    dong_name: str | None = Field(default=None, serialization_alias="dong")
    region_code_5: str = Field(serialization_alias="regionCode5")


class RegionSearchResponse(BaseModel):
    items: list[RegionResponse]


class RegionHierarchyResponse(BaseModel):
    sidos: list[str]
    sigungus: list[str]
    dongs: list[RegionResponse]
