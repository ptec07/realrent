from __future__ import annotations

import io
import zipfile

from app.ingestion.nationwide_admin import (
    NationwideIngestJob,
    build_nationwide_ingest_jobs,
    parse_active_sigungu_codes,
)


def _lawd_zip(text: str) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("법정동코드 전체자료.txt", text.encode("cp949"))
    return buffer.getvalue()


def test_parse_active_sigungu_codes_keeps_only_active_city_county_district_rows() -> None:
    zip_bytes = _lawd_zip(
        "법정동코드\t법정동명\t폐지여부\n"
        "1100000000\t서울특별시\t존재\n"
        "1111000000\t서울특별시 종로구\t존재\n"
        "1111010100\t서울특별시 종로구 청운동\t존재\n"
        "4111100000\t경기도 수원시 장안구\t존재\n"
        "4111112900\t경기도 수원시 장안구 조원동\t존재\n"
        "4111300000\t경기도 수원시 권선구\t폐지\n"
        "5011000000\t제주특별자치도 제주시\t존재\n"
    )

    regions = parse_active_sigungu_codes(zip_bytes)

    assert regions == [
        ("11110", "서울특별시", "종로구"),
        ("41111", "경기도", "수원시 장안구"),
        ("50110", "제주특별자치도", "제주시"),
    ]


def test_build_nationwide_ingest_jobs_covers_all_regions_sources_and_transaction_kinds() -> None:
    jobs = build_nationwide_ingest_jobs(
        regions=[("11110", "서울특별시", "종로구"), ("50110", "제주특별자치도", "제주시")],
        month="2025-01",
    )

    assert jobs == [
        NationwideIngestJob("apartment", "11110", "2025-01", "서울특별시", "종로구", "rent"),
        NationwideIngestJob("officetel", "11110", "2025-01", "서울특별시", "종로구", "rent"),
        NationwideIngestJob("apartment", "11110", "2025-01", "서울특별시", "종로구", "sale"),
        NationwideIngestJob("officetel", "11110", "2025-01", "서울특별시", "종로구", "sale"),
        NationwideIngestJob("apartment", "50110", "2025-01", "제주특별자치도", "제주시", "rent"),
        NationwideIngestJob("officetel", "50110", "2025-01", "제주특별자치도", "제주시", "rent"),
        NationwideIngestJob("apartment", "50110", "2025-01", "제주특별자치도", "제주시", "sale"),
        NationwideIngestJob("officetel", "50110", "2025-01", "제주특별자치도", "제주시", "sale"),
    ]

    assert jobs[0].payload() == {
        "sourceType": "apartment",
        "regionCode5": "11110",
        "month": "2025-01",
        "regionSido": "서울특별시",
        "regionSigungu": "종로구",
        "transactionKind": "rent",
    }
