from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import HousingType, RentType
from app.models.rental_transaction import RentalTransaction

SummaryRentType = RentType | Literal["all"]
LOW_SAMPLE_THRESHOLD = 5
LOW_SAMPLE_WARNING = "거래 표본이 적어 평균이 왜곡될 수 있습니다."


@dataclass(frozen=True)
class RegionSummary:
    region_code_5: str
    source_type: HousingType | None
    rent_type: SummaryRentType | None
    months: int
    transaction_count: int
    avg_deposit_manwon: int | None
    avg_monthly_rent_manwon: int | None
    avg_area_m2: Decimal | None
    latest_month: str | None
    sample_warning: str | None


def get_region_summary(
    db: Session,
    *,
    region_code_5: str,
    source_type: HousingType | str | None = None,
    rent_type: SummaryRentType | str | None = None,
    months: int = 12,
) -> RegionSummary:
    normalized_source_type = HousingType(source_type) if source_type else None
    normalized_rent_type: SummaryRentType | None
    if rent_type == "all" or rent_type is None:
        normalized_rent_type = rent_type
    else:
        normalized_rent_type = RentType(rent_type)

    statement = select(RentalTransaction).where(RentalTransaction.region_code_5 == region_code_5)
    if normalized_source_type:
        statement = statement.where(RentalTransaction.source_type == normalized_source_type)
    if normalized_rent_type and normalized_rent_type != "all":
        statement = statement.where(RentalTransaction.rent_type == normalized_rent_type)

    matched_transactions = list(db.scalars(statement).all())
    latest_month = max((transaction.contract_year_month for transaction in matched_transactions), default=None)
    if latest_month is not None:
        cutoff_month = _subtract_months(latest_month, months - 1)
        matched_transactions = [
            transaction for transaction in matched_transactions if transaction.contract_year_month >= cutoff_month
        ]

    transaction_count = len(matched_transactions)
    sample_warning = LOW_SAMPLE_WARNING if transaction_count < LOW_SAMPLE_THRESHOLD else None

    if transaction_count == 0:
        return RegionSummary(
            region_code_5=region_code_5,
            source_type=normalized_source_type,
            rent_type=normalized_rent_type,
            months=months,
            transaction_count=0,
            avg_deposit_manwon=None,
            avg_monthly_rent_manwon=None,
            avg_area_m2=None,
            latest_month=None,
            sample_warning=sample_warning,
        )

    return RegionSummary(
        region_code_5=region_code_5,
        source_type=normalized_source_type,
        rent_type=normalized_rent_type,
        months=months,
        transaction_count=transaction_count,
        avg_deposit_manwon=_average_int(transaction.deposit_amount_manwon for transaction in matched_transactions),
        avg_monthly_rent_manwon=_average_int(transaction.monthly_rent_manwon for transaction in matched_transactions),
        avg_area_m2=_average_decimal(transaction.area_m2 for transaction in matched_transactions),
        latest_month=max(transaction.contract_year_month for transaction in matched_transactions),
        sample_warning=sample_warning,
    )


def _average_int(values) -> int:
    decimals = [Decimal(value) for value in values]
    return int((sum(decimals) / len(decimals)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _average_decimal(values) -> Decimal:
    decimals = [Decimal(value) for value in values]
    return (sum(decimals) / len(decimals)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _subtract_months(month_label: str, delta: int) -> str:
    year = int(month_label[:4])
    month = int(month_label[5:7])
    month_index = year * 12 + (month - 1) - delta
    new_year, zero_based_month = divmod(month_index, 12)
    return f"{new_year:04d}-{zero_based_month + 1:02d}"
