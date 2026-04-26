from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import HousingType, RentType
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.rental_transaction import RentalTransaction

TrendRentType = RentType | Literal["all"]


@dataclass(frozen=True)
class TrendPoint:
    month: str
    transaction_count: int
    avg_deposit_manwon: int | None
    avg_monthly_rent_manwon: int | None
    avg_area_m2: Decimal | None


@dataclass(frozen=True)
class RegionTrend:
    region_code_5: str
    source_type: HousingType | None
    rent_type: TrendRentType | None
    months: int
    points: list[TrendPoint]


def get_region_trend(
    db: Session,
    *,
    region_code_5: str,
    source_type: HousingType | str | None = None,
    rent_type: TrendRentType | str | None = None,
    months: int = 12,
) -> RegionTrend:
    normalized_source_type = HousingType(source_type) if source_type else None
    normalized_rent_type: TrendRentType | None
    if rent_type == "all" or rent_type is None:
        normalized_rent_type = rent_type
    else:
        normalized_rent_type = RentType(rent_type)

    summary_points = _summary_points(
        db,
        region_code_5=region_code_5,
        source_type=normalized_source_type,
        rent_type=normalized_rent_type,
        months=months,
    )
    if summary_points:
        points = summary_points
    else:
        points = _live_transaction_points(
            db,
            region_code_5=region_code_5,
            source_type=normalized_source_type,
            rent_type=normalized_rent_type,
            months=months,
        )

    return RegionTrend(
        region_code_5=region_code_5,
        source_type=normalized_source_type,
        rent_type=normalized_rent_type,
        months=months,
        points=points,
    )


def _summary_points(
    db: Session,
    *,
    region_code_5: str,
    source_type: HousingType | None,
    rent_type: TrendRentType | None,
    months: int,
) -> list[TrendPoint]:
    statement = select(MonthlyRegionSummary).where(MonthlyRegionSummary.region_code_5 == region_code_5)
    if source_type:
        statement = statement.where(MonthlyRegionSummary.source_type == source_type)
    if rent_type and rent_type != "all":
        statement = statement.where(MonthlyRegionSummary.rent_type == rent_type)

    summaries = list(db.scalars(statement).all())
    latest_month = max((summary.month_label for summary in summaries), default=None)
    if latest_month is None:
        return []
    cutoff_month = _subtract_months(latest_month, months - 1)
    return [
        TrendPoint(
            month=summary.month_label,
            transaction_count=summary.transaction_count,
            avg_deposit_manwon=summary.avg_deposit_manwon,
            avg_monthly_rent_manwon=summary.avg_monthly_rent_manwon,
            avg_area_m2=_quantize_decimal(summary.avg_area_m2),
        )
        for summary in sorted(summaries, key=lambda item: item.month_label)
        if summary.month_label >= cutoff_month
    ]


def _live_transaction_points(
    db: Session,
    *,
    region_code_5: str,
    source_type: HousingType | None,
    rent_type: TrendRentType | None,
    months: int,
) -> list[TrendPoint]:
    statement = select(RentalTransaction).where(RentalTransaction.region_code_5 == region_code_5)
    if source_type:
        statement = statement.where(RentalTransaction.source_type == source_type)
    if rent_type and rent_type != "all":
        statement = statement.where(RentalTransaction.rent_type == rent_type)

    transactions = list(db.scalars(statement).all())
    latest_month = max((transaction.contract_year_month for transaction in transactions), default=None)
    if latest_month is None:
        return []
    cutoff_month = _subtract_months(latest_month, months - 1)
    transactions = [transaction for transaction in transactions if transaction.contract_year_month >= cutoff_month]

    grouped: dict[str, list[RentalTransaction]] = defaultdict(list)
    for transaction in transactions:
        grouped[transaction.contract_year_month].append(transaction)

    return [
        TrendPoint(
            month=month,
            transaction_count=len(month_transactions),
            avg_deposit_manwon=_average_int(transaction.deposit_amount_manwon for transaction in month_transactions),
            avg_monthly_rent_manwon=_average_int(transaction.monthly_rent_manwon for transaction in month_transactions),
            avg_area_m2=_average_decimal(transaction.area_m2 for transaction in month_transactions),
        )
        for month, month_transactions in sorted(grouped.items())
    ]


def _average_int(values: Iterable[int]) -> int:
    decimals = [Decimal(value) for value in values]
    return int((sum(decimals) / len(decimals)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _average_decimal(values: Iterable[Decimal]) -> Decimal:
    decimals = [Decimal(value) for value in values]
    return _quantize_decimal(sum(decimals) / len(decimals))


def _quantize_decimal(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _subtract_months(month_label: str, delta: int) -> str:
    year = int(month_label[:4])
    month = int(month_label[5:7])
    month_index = year * 12 + (month - 1) - delta
    new_year, zero_based_month = divmod(month_index, 12)
    return f"{new_year:04d}-{zero_based_month + 1:02d}"
