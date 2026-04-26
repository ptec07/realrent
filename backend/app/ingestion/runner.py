from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingestion.aggregator import aggregate_monthly_region_summaries
from app.ingestion.molit_client import MolitClient
from app.ingestion.normalizer import normalize_rental_transaction
from app.ingestion.xml_parser import parse_public_data_items
from app.models.region import Region
from app.models.rental_transaction import RentalTransaction


@dataclass(frozen=True)
class IngestionResult:
    fetched_count: int
    inserted_count: int
    skipped_duplicate_count: int
    summary_count: int


def ingest_rent_transactions(
    db: Session,
    *,
    source_type: str,
    region_code_5: str,
    contract_year_month: str,
    region_sido: str,
    region_sigungu: str,
    client: MolitClient | None = None,
) -> IngestionResult:
    """Fetch one region/month from MOLIT and persist normalized rental transactions."""

    molit_client = client or MolitClient()
    xml_text = molit_client.fetch_rent_transactions(
        source_type=source_type,
        region_code_5=region_code_5,
        contract_year_month=contract_year_month,
    )
    rows = parse_public_data_items(xml_text)

    inserted_count = 0
    skipped_duplicate_count = 0
    seen_source_hashes: set[str] = set()
    for row in rows:
        enriched_row = _enrich_public_data_row(
            row,
            region_code_5=region_code_5,
            region_sido=region_sido,
            region_sigungu=region_sigungu,
        )
        normalized = normalize_rental_transaction(enriched_row, source_type=source_type)
        source_hash = normalized["source_hash"]
        if source_hash in seen_source_hashes or _source_hash_exists(db, source_hash):
            skipped_duplicate_count += 1
            continue
        seen_source_hashes.add(source_hash)
        db.add(RentalTransaction(**normalized))
        _upsert_region(db, normalized)
        inserted_count += 1

    db.flush()
    aggregation_result = aggregate_monthly_region_summaries(
        db,
        region_code_5=region_code_5,
        source_type=source_type,
        month_label=_normalize_summary_month(contract_year_month),
    )
    db.commit()
    return IngestionResult(
        fetched_count=len(rows),
        inserted_count=inserted_count,
        skipped_duplicate_count=skipped_duplicate_count,
        summary_count=aggregation_result.summary_count,
    )


def _enrich_public_data_row(
    row: dict[str, str],
    *,
    region_code_5: str,
    region_sido: str,
    region_sigungu: str,
) -> dict[str, str]:
    enriched = dict(row)
    enriched.setdefault("지역코드", region_code_5)
    enriched.setdefault("시도", region_sido)
    enriched.setdefault("시군구", region_sigungu)
    return enriched


def _source_hash_exists(db: Session, source_hash: str) -> bool:
    with db.no_autoflush:
        return db.scalar(select(RentalTransaction.id).where(RentalTransaction.source_hash == source_hash).limit(1)) is not None


def _upsert_region(db: Session, normalized: dict) -> None:
    dong_name = normalized.get("region_dong")
    statement = select(Region).where(
        Region.region_code_5 == normalized["region_code_5"],
        Region.dong_name == dong_name,
    )
    existing = db.scalar(statement.limit(1))
    full_name_parts = [normalized["region_sido"], normalized["region_sigungu"]]
    if dong_name:
        full_name_parts.append(dong_name)
    full_name = " ".join(full_name_parts)
    if existing:
        existing.sido_name = normalized["region_sido"]
        existing.sigungu_name = normalized["region_sigungu"]
        existing.full_name = full_name
        existing.is_target_region = True
        return
    db.add(
        Region(
            sido_name=normalized["region_sido"],
            sigungu_name=normalized["region_sigungu"],
            dong_name=dong_name,
            region_code_5=normalized["region_code_5"],
            region_code_full=None,
            full_name=full_name,
            is_target_region=True,
        )
    )
    db.flush()


def _normalize_summary_month(contract_year_month: str) -> str:
    compact = contract_year_month.strip().replace("-", "")
    if len(compact) != 6 or not compact.isdigit():
        raise ValueError("contract_year_month must be in YYYYMM or YYYY-MM format")
    return f"{compact[:4]}-{compact[4:]}"
