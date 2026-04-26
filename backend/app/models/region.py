from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Region(Base):
    __tablename__ = "regions"
    __table_args__ = (
        Index("idx_regions_region_code_5", "region_code_5"),
        Index("idx_regions_full_name", "full_name"),
        Index("idx_regions_target", "is_target_region"),
        Index("idx_regions_search_names", "sido_name", "sigungu_name", "dong_name"),
        Index("uq_regions_code_full", "region_code_full", unique=True, postgresql_where="region_code_full IS NOT NULL"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    sido_name: Mapped[str] = mapped_column(String(50), nullable=False)
    sigungu_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dong_name: Mapped[str | None] = mapped_column(String(100))
    region_code_5: Mapped[str] = mapped_column(String(5), nullable=False)
    region_code_full: Mapped[str | None] = mapped_column(String(20))
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_target_region: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
