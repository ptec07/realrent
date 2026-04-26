from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.ingestion.runner import IngestionResult, ingest_rent_transactions

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class AdminIngestRequest(BaseModel):
    source_type: str = Field(alias="sourceType")
    region_code_5: str = Field(alias="regionCode5")
    month: str
    region_sido: str = Field(alias="regionSido")
    region_sigungu: str = Field(alias="regionSigungu")


class AdminIngestResponse(BaseModel):
    fetched_count: int = Field(serialization_alias="fetchedCount")
    inserted_count: int = Field(serialization_alias="insertedCount")
    skipped_duplicate_count: int = Field(serialization_alias="skippedDuplicateCount")
    summary_count: int = Field(serialization_alias="summaryCount")


@router.post("/ingest", response_model=AdminIngestResponse, response_model_by_alias=True)
def ingest_public_data(
    request: AdminIngestRequest,
    db: Session = Depends(get_db),
    admin_token: str | None = Header(default=None, alias="x-realrent-admin-token"),
) -> AdminIngestResponse:
    if not settings.ingest_admin_token or admin_token != settings.ingest_admin_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin ingestion is disabled or unauthorized")

    result = ingest_rent_transactions(
        db,
        source_type=request.source_type,
        region_code_5=request.region_code_5,
        contract_year_month=request.month,
        region_sido=request.region_sido,
        region_sigungu=request.region_sigungu,
    )
    return AdminIngestResponse(
        fetched_count=result.fetched_count,
        inserted_count=result.inserted_count,
        skipped_duplicate_count=result.skipped_duplicate_count,
        summary_count=result.summary_count,
    )
