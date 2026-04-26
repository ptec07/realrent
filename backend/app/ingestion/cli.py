from __future__ import annotations

import argparse

from app.database import SessionLocal
from app.ingestion.runner import ingest_rent_transactions


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest one RealRent public-data region/month batch.")
    parser.add_argument("--source-type", choices=["apartment", "officetel"], required=True)
    parser.add_argument("--region-code-5", required=True)
    parser.add_argument("--month", required=True, help="Contract month in YYYYMM or YYYY-MM format")
    parser.add_argument("--region-sido", required=True)
    parser.add_argument("--region-sigungu", required=True)
    args = parser.parse_args()

    with SessionLocal() as db:
        result = ingest_rent_transactions(
            db,
            source_type=args.source_type,
            region_code_5=args.region_code_5,
            contract_year_month=args.month,
            region_sido=args.region_sido,
            region_sigungu=args.region_sigungu,
        )
    print(
        "ingestion_complete "
        f"fetched={result.fetched_count} "
        f"inserted={result.inserted_count} "
        f"duplicates={result.skipped_duplicate_count} "
        f"summaries={result.summary_count}"
    )


if __name__ == "__main__":
    main()
