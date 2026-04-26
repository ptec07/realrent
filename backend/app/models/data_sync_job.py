from datetime import datetime

from sqlalchemy import DateTime, Enum, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import HousingType, SyncStatus


class DataSyncJob(Base):
    __tablename__ = "data_sync_jobs"
    __table_args__ = (
        Index("idx_sync_jobs_status", "status"),
        Index("idx_sync_jobs_target", "source_type", "region_code_5", "target_year_month"),
        Index("uq_sync_job_target", "source_type", "region_code_5", "target_year_month", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_type: Mapped[HousingType] = mapped_column(Enum(HousingType, name="housing_type"), nullable=False)
    region_code_5: Mapped[str] = mapped_column(String(5), nullable=False)
    target_year_month: Mapped[str] = mapped_column(String(6), nullable=False)
    status: Mapped[SyncStatus] = mapped_column(Enum(SyncStatus, name="sync_status"), nullable=False, default=SyncStatus.pending)
    fetched_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    inserted_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skipped_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
