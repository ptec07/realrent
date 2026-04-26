from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, Index, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import HousingType, RentType


class MonthlyRegionSummary(Base):
    __tablename__ = "monthly_region_summaries"
    __table_args__ = (
        Index("idx_monthly_summary_region", "region_code_5"),
        Index("idx_monthly_summary_region_type_month", "region_code_5", "source_type", "rent_type", "month_label"),
        Index("uq_monthly_summary_key", "region_code_5", "source_type", "rent_type", "month_label", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    region_code_5: Mapped[str] = mapped_column(String(5), nullable=False)
    region_sido: Mapped[str] = mapped_column(String(50), nullable=False)
    region_sigungu: Mapped[str] = mapped_column(String(100), nullable=False)
    region_dong: Mapped[str | None] = mapped_column(String(100))
    source_type: Mapped[HousingType] = mapped_column(Enum(HousingType, name="housing_type"), nullable=False)
    rent_type: Mapped[RentType] = mapped_column(Enum(RentType, name="rent_type"), nullable=False)
    month_label: Mapped[str] = mapped_column(String(7), nullable=False)
    transaction_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_deposit_manwon: Mapped[int | None] = mapped_column(Integer)
    avg_monthly_rent_manwon: Mapped[int | None] = mapped_column(Integer)
    avg_area_m2: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    min_deposit_manwon: Mapped[int | None] = mapped_column(Integer)
    max_deposit_manwon: Mapped[int | None] = mapped_column(Integer)
    min_monthly_rent_manwon: Mapped[int | None] = mapped_column(Integer)
    max_monthly_rent_manwon: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
