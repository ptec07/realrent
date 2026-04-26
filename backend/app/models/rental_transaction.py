from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, Index, Integer, JSON, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import HousingType, RentType


class RentalTransaction(Base):
    __tablename__ = "rental_transactions"
    __table_args__ = (
        Index("idx_rental_region_month", "region_code_5", "contract_year_month"),
        Index("idx_rental_region_type_rent", "region_code_5", "source_type", "rent_type"),
        Index("idx_rental_contract_date", "contract_date"),
        Index("idx_rental_budget", "deposit_amount_manwon", "monthly_rent_manwon"),
        Index("idx_rental_area", "area_m2"),
        Index("idx_rental_building", "building_name"),
        Index("uq_rental_source_hash", "source_hash", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_type: Mapped[HousingType] = mapped_column(Enum(HousingType, name="housing_type"), nullable=False)
    rent_type: Mapped[RentType] = mapped_column(Enum(RentType, name="rent_type"), nullable=False)
    region_sido: Mapped[str] = mapped_column(String(50), nullable=False)
    region_sigungu: Mapped[str] = mapped_column(String(100), nullable=False)
    region_dong: Mapped[str | None] = mapped_column(String(100))
    region_code_5: Mapped[str] = mapped_column(String(5), nullable=False)
    building_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_jibun: Mapped[str | None] = mapped_column(String(100))
    area_m2: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    floor: Mapped[int | None] = mapped_column(Integer)
    built_year: Mapped[int | None] = mapped_column(Integer)
    contract_date: Mapped[date] = mapped_column(Date, nullable=False)
    contract_year_month: Mapped[str] = mapped_column(String(7), nullable=False)
    deposit_amount_manwon: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_rent_manwon: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    raw_payload: Mapped[dict | None] = mapped_column(JSON)
    source_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
