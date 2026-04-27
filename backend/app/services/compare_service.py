from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from sqlalchemy.orm import Session

from app.models.enums import HousingType, RentType
from app.services.summary_service import RegionSummary, get_region_summary

CompareRentType = RentType | Literal["all"]
INSUFFICIENT_SAMPLE_INSIGHT = "비교할 거래 표본이 부족합니다."


@dataclass(frozen=True)
class CompareDiff:
    deposit_manwon: int | None
    monthly_rent_manwon: int | None


@dataclass(frozen=True)
class RegionCompareResult:
    region_a: RegionSummary
    region_b: RegionSummary
    diff: CompareDiff
    insight: str


def compare_regions(
    db: Session,
    *,
    region_a: str,
    region_b: str,
    dong_a: str | None = None,
    dong_b: str | None = None,
    source_type: HousingType | str | None = None,
    rent_type: CompareRentType | str | None = None,
    months: int = 12,
) -> RegionCompareResult:
    summary_a = get_region_summary(
        db,
        region_code_5=region_a,
        dong=dong_a,
        source_type=source_type,
        rent_type=rent_type,
        months=months,
    )
    summary_b = get_region_summary(
        db,
        region_code_5=region_b,
        dong=dong_b,
        source_type=source_type,
        rent_type=rent_type,
        months=months,
    )

    deposit_diff = _diff(summary_b.avg_deposit_manwon, summary_a.avg_deposit_manwon)
    rent_diff = _diff(summary_b.avg_monthly_rent_manwon, summary_a.avg_monthly_rent_manwon)
    insight = build_compare_insight(
        region_a_label="A",
        region_b_label="B",
        deposit_diff_manwon=deposit_diff,
        monthly_rent_diff_manwon=rent_diff,
    )

    return RegionCompareResult(
        region_a=summary_a,
        region_b=summary_b,
        diff=CompareDiff(deposit_manwon=deposit_diff, monthly_rent_manwon=rent_diff),
        insight=insight,
    )


def build_compare_insight(
    *,
    region_a_label: str,
    region_b_label: str,
    deposit_diff_manwon: int | None,
    monthly_rent_diff_manwon: int | None,
) -> str:
    if deposit_diff_manwon is None or monthly_rent_diff_manwon is None:
        return INSUFFICIENT_SAMPLE_INSIGHT
    if deposit_diff_manwon < 0 and monthly_rent_diff_manwon < 0:
        return f"{region_b_label}가 {region_a_label}보다 평균 보증금과 월세가 낮습니다."
    if deposit_diff_manwon < 0:
        return f"{region_b_label}가 {region_a_label}보다 평균 보증금이 낮습니다."
    if monthly_rent_diff_manwon < 0:
        return f"{region_b_label}가 {region_a_label}보다 평균 월세가 낮습니다."
    return "두 지역의 평균 가격 수준이 비슷합니다."


def _diff(value_b: int | Decimal | None, value_a: int | Decimal | None) -> int | None:
    if value_a is None or value_b is None:
        return None
    return int(value_b - value_a)
