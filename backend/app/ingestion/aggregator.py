from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.enums import HousingType, RentType
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.rental_transaction import RentalTransaction


@dataclass(frozen=True)
class AggregationResult:
    summary_count: int
    created_count: int


def aggregate_monthly_region_summaries(
    db: Session,
    *,
    region_code_5: str | None = None,
    source_type: HousingType | str | None = None,
    rent_type: RentType | str | None = None,
    month_label: str | None = None,
) -> AggregationResult:
    """Rebuild monthly summaries from normalized rental transactions."""

    normalized_source_type = HousingType(source_type) if source_type else None
    normalized_rent_type = RentType(rent_type) if rent_type else None

    statement = select(RentalTransaction)
    if region_code_5:
        statement = statement.where(RentalTransaction.region_code_5 == region_code_5)
    if normalized_source_type:
        statement = statement.where(RentalTransaction.source_type == normalized_source_type)
    if normalized_rent_type:
        statement = statement.where(RentalTransaction.rent_type == normalized_rent_type)
    if month_label:
        statement = statement.where(RentalTransaction.contract_year_month == month_label)

    transactions = list(db.scalars(statement).all())
    _delete_existing_summaries(
        db,
        region_code_5=region_code_5,
        source_type=normalized_source_type,
        rent_type=normalized_rent_type,
        month_label=month_label,
    )

    summaries = [_build_summary(group) for group in _group_transactions(transactions).values()]
    db.add_all(summaries)
    db.flush()
    return AggregationResult(summary_count=len(summaries), created_count=len(summaries))


def _delete_existing_summaries(
    db: Session,
    *,
    region_code_5: str | None,
    source_type: HousingType | None,
    rent_type: RentType | None,
    month_label: str | None,
) -> None:
    statement = delete(MonthlyRegionSummary)
    if region_code_5:
        statement = statement.where(MonthlyRegionSummary.region_code_5 == region_code_5)
    if source_type:
        statement = statement.where(MonthlyRegionSummary.source_type == source_type)
    if rent_type:
        statement = statement.where(MonthlyRegionSummary.rent_type == rent_type)
    if month_label:
        statement = statement.where(MonthlyRegionSummary.month_label == month_label)
    db.execute(statement)


def _group_transactions(transactions: list[RentalTransaction]) -> dict[tuple[str, HousingType, RentType, str], list[RentalTransaction]]:
    groups: dict[tuple[str, HousingType, RentType, str], list[RentalTransaction]] = {}
    for transaction in transactions:
        key = (
            transaction.region_code_5,
            transaction.source_type,
            transaction.rent_type,
            transaction.contract_year_month,
        )
        groups.setdefault(key, []).append(transaction)
    return groups


def _build_summary(transactions: list[RentalTransaction]) -> MonthlyRegionSummary:
    first = transactions[0]
    deposits = [transaction.deposit_amount_manwon for transaction in transactions]
    rents = [transaction.monthly_rent_manwon for transaction in transactions]
    areas = [transaction.area_m2 for transaction in transactions]

    return MonthlyRegionSummary(
        region_code_5=first.region_code_5,
        region_sido=first.region_sido,
        region_sigungu=first.region_sigungu,
        region_dong=first.region_dong,
        source_type=first.source_type,
        rent_type=first.rent_type,
        month_label=first.contract_year_month,
        transaction_count=len(transactions),
        avg_deposit_manwon=_average_int(deposits),
        avg_monthly_rent_manwon=_average_int(rents),
        avg_area_m2=_average_decimal(areas),
        min_deposit_manwon=min(deposits),
        max_deposit_manwon=max(deposits),
        min_monthly_rent_manwon=min(rents),
        max_monthly_rent_manwon=max(rents),
    )


def _average_int(values: list[int]) -> int:
    decimals = [Decimal(value) for value in values]
    return int((sum(decimals) / len(decimals)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _average_decimal(values: list[Decimal]) -> Decimal:
    decimals = [Decimal(value) for value in values]
    return (sum(decimals) / len(decimals)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
