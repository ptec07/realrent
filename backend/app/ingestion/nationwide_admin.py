from __future__ import annotations

import argparse
import csv
import io
import json
import os
import sys
import time
import zipfile
from dataclasses import dataclass
from typing import Iterable, Sequence
from urllib import error, request

LAWD_CODE_ZIP_URL = "https://www.code.go.kr/etc/codeFullDown.do?codeseId=00002"
DEFAULT_ADMIN_INGEST_URL = "https://realrent-backend.onrender.com/api/admin/ingest"
DEFAULT_SOURCE_TYPES = ("apartment", "officetel")
DEFAULT_TRANSACTION_KINDS = ("rent", "sale")


@dataclass(frozen=True)
class NationwideIngestJob:
    source_type: str
    region_code_5: str
    month: str
    region_sido: str
    region_sigungu: str
    transaction_kind: str

    def payload(self) -> dict[str, str]:
        return {
            "sourceType": self.source_type,
            "regionCode5": self.region_code_5,
            "month": self.month,
            "regionSido": self.region_sido,
            "regionSigungu": self.region_sigungu,
            "transactionKind": self.transaction_kind,
        }

    def label(self) -> str:
        return (
            f"{self.region_code_5} {self.region_sido} {self.region_sigungu} "
            f"{self.source_type} {self.transaction_kind} {self.month}"
        )


def fetch_lawd_code_zip(url: str = LAWD_CODE_ZIP_URL, *, timeout: int = 30) -> bytes:
    req = request.Request(url, headers={"User-Agent": "RealRent nationwide ingestion/1.0"})
    with request.urlopen(req, timeout=timeout) as response:
        return response.read()


def parse_active_sigungu_codes(zip_bytes: bytes) -> list[tuple[str, str, str]]:
    """Return active MOLIT 5-digit 시군구 LAWD codes from the official 법정동 code zip."""

    rows: list[tuple[str, str, str]] = []
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        txt_name = _first_text_member(archive)
        raw = archive.read(txt_name)
    text = _decode_lawd_text(raw)
    reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    for row in reader:
        code = (row.get("법정동코드") or "").strip()
        name = (row.get("법정동명") or "").strip()
        status = (row.get("폐지여부") or "").strip()
        if not _is_active_sigungu_row(code, name, status):
            continue
        name_parts = name.split()
        if len(name_parts) < 2:
            continue
        rows.append((code[:5], name_parts[0], " ".join(name_parts[1:])))
    return rows


def build_nationwide_ingest_jobs(
    *,
    regions: Sequence[tuple[str, str, str]],
    month: str,
    source_types: Sequence[str] = DEFAULT_SOURCE_TYPES,
    transaction_kinds: Sequence[str] = DEFAULT_TRANSACTION_KINDS,
) -> list[NationwideIngestJob]:
    jobs: list[NationwideIngestJob] = []
    for region_code_5, region_sido, region_sigungu in regions:
        for transaction_kind in transaction_kinds:
            for source_type in source_types:
                jobs.append(
                    NationwideIngestJob(
                        source_type=source_type,
                        region_code_5=region_code_5,
                        month=month,
                        region_sido=region_sido,
                        region_sigungu=region_sigungu,
                        transaction_kind=transaction_kind,
                    )
                )
    return jobs


def run_admin_ingestion_jobs(
    jobs: Iterable[NationwideIngestJob],
    *,
    admin_url: str = DEFAULT_ADMIN_INGEST_URL,
    admin_token: str,
    timeout: int = 120,
    pause_seconds: float = 0.0,
    resume_after: str | None = None,
) -> dict[str, int]:
    totals = {"jobs": 0, "succeeded": 0, "failed": 0, "fetched": 0, "inserted": 0, "duplicates": 0}
    skipping = bool(resume_after)
    for job in jobs:
        if skipping:
            if job.label() == resume_after:
                skipping = False
            else:
                continue
        totals["jobs"] += 1
        try:
            result = post_admin_ingest(job, admin_url=admin_url, admin_token=admin_token, timeout=timeout)
        except Exception as exc:  # noqa: BLE001 - CLI should keep a readable operational log.
            totals["failed"] += 1
            print(f"failed {job.label()} error={exc}", flush=True)
            continue
        totals["succeeded"] += 1
        totals["fetched"] += int(result.get("fetchedCount", 0))
        totals["inserted"] += int(result.get("insertedCount", 0))
        totals["duplicates"] += int(result.get("skippedDuplicateCount", 0))
        print(
            "succeeded "
            f"{job.label()} "
            f"fetched={result.get('fetchedCount', 0)} "
            f"inserted={result.get('insertedCount', 0)} "
            f"duplicates={result.get('skippedDuplicateCount', 0)}",
            flush=True,
        )
        if pause_seconds > 0:
            time.sleep(pause_seconds)
    return totals


def post_admin_ingest(
    job: NationwideIngestJob,
    *,
    admin_url: str,
    admin_token: str,
    timeout: int,
) -> dict[str, object]:
    data = json.dumps(job.payload()).encode("utf-8")
    req = request.Request(
        admin_url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-realrent-admin-token": admin_token,
            "User-Agent": "RealRent nationwide ingestion/1.0",
        },
    )
    try:
        with request.urlopen(req, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"HTTP {exc.code}: {body}") from exc


def _first_text_member(archive: zipfile.ZipFile) -> str:
    for name in archive.namelist():
        if name.endswith(".txt"):
            return name
    raise ValueError("법정동 코드 zip에 txt 파일이 없습니다")


def _decode_lawd_text(raw: bytes) -> str:
    for encoding in ("cp949", "utf-8-sig", "utf-8"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("cp949", errors="replace")


def _is_active_sigungu_row(code: str, name: str, status: str) -> bool:
    if len(code) != 10 or not code.isdigit() or not name or status != "존재":
        return False
    if not code.endswith("00000"):
        return False
    if code[2:5] == "000":
        return False
    return True


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run RealRent nationwide public-data ingestion through the admin API.")
    parser.add_argument("--month", required=True, help="Contract month in YYYY-MM or YYYYMM format")
    parser.add_argument("--admin-url", default=DEFAULT_ADMIN_INGEST_URL)
    parser.add_argument("--token-env", default="INGEST_ADMIN_TOKEN")
    parser.add_argument("--dry-run", action="store_true", help="Only print the planned job count and sample jobs")
    parser.add_argument("--pause-seconds", type=float, default=0.0)
    parser.add_argument("--resume-after", help="Skip jobs until this exact job label is reached")
    args = parser.parse_args(argv)

    zip_bytes = fetch_lawd_code_zip()
    regions = parse_active_sigungu_codes(zip_bytes)
    jobs = build_nationwide_ingest_jobs(regions=regions, month=args.month)
    print(f"regions={len(regions)} jobs={len(jobs)} month={args.month}", flush=True)
    for sample in jobs[:5]:
        print(f"sample {sample.label()}", flush=True)
    if args.dry_run:
        return 0

    admin_token = os.environ.get(args.token_env)
    if not admin_token:
        print(f"missing admin token env: {args.token_env}", file=sys.stderr)
        return 2
    totals = run_admin_ingestion_jobs(
        jobs,
        admin_url=args.admin_url,
        admin_token=admin_token,
        pause_seconds=args.pause_seconds,
        resume_after=args.resume_after,
    )
    print("totals " + " ".join(f"{key}={value}" for key, value in totals.items()), flush=True)
    return 1 if totals["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
