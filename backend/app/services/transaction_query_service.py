from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.enums import HousingType, RentType
from app.models.rental_transaction import RentalTransaction

TransactionSort = Literal["latest", "deposit_asc", "monthly_rent_asc"]


@dataclass(frozen=True)
class TransactionQueryResult:
    items: list[RentalTransaction]
    total: int
    page: int
    page_size: int


def search_transactions(
    db: Session,
    *,
    region_code_5: str,
    dong: str | None = None,
    source_type: HousingType | str | None = None,
    rent_type: RentType | str | None = None,
    deposit_max: int | None = None,
    monthly_rent_max: int | None = None,
    area_min: float | None = None,
    area_max: float | None = None,
    sort: TransactionSort = "latest",
    page: int = 1,
    page_size: int = 20,
) -> TransactionQueryResult:
    statement = select(RentalTransaction).where(RentalTransaction.region_code_5 == region_code_5)

    if dong:
        statement = statement.where(RentalTransaction.region_dong == dong.strip())
    if source_type:
        statement = statement.where(RentalTransaction.source_type == HousingType(source_type))
    if rent_type and rent_type != "all":
        statement = statement.where(RentalTransaction.rent_type == RentType(rent_type))
    if deposit_max is not None:
        statement = statement.where(RentalTransaction.deposit_amount_manwon <= deposit_max)
    if monthly_rent_max is not None:
        statement = statement.where(RentalTransaction.monthly_rent_manwon <= monthly_rent_max)
    if area_min is not None:
        statement = statement.where(RentalTransaction.area_m2 >= area_min)
    if area_max is not None:
        statement = statement.where(RentalTransaction.area_m2 <= area_max)

    total = _count(db, statement)
    statement = _apply_sort(statement, sort).offset((page - 1) * page_size).limit(page_size)
    items = list(db.scalars(statement).all())

    return TransactionQueryResult(items=items, total=total, page=page, page_size=page_size)


def _count(db: Session, statement: Select[tuple[RentalTransaction]]) -> int:
    count_statement = select(func.count()).select_from(statement.order_by(None).subquery())
    return int(db.scalar(count_statement) or 0)


def _apply_sort(statement: Select[tuple[RentalTransaction]], sort: TransactionSort) -> Select[tuple[RentalTransaction]]:
    if sort == "deposit_asc":
        return statement.order_by(RentalTransaction.deposit_amount_manwon.asc(), RentalTransaction.contract_date.desc(), RentalTransaction.id.desc())
    if sort == "monthly_rent_asc":
        return statement.order_by(RentalTransaction.monthly_rent_manwon.asc(), RentalTransaction.contract_date.desc(), RentalTransaction.id.desc())
    return statement.order_by(RentalTransaction.contract_date.desc(), RentalTransaction.id.desc())
