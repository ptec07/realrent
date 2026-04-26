from __future__ import annotations

import hashlib
import json
from datetime import date
from decimal import Decimal
from typing import Any

from app.models.enums import HousingType, RentType


def normalize_rental_transaction(row: dict[str, str], *, source_type: HousingType | str) -> dict[str, Any]:
    """Normalize one MOLIT rental transaction row into RealRent fields."""

    normalized_source_type = HousingType(source_type)
    monthly_rent = _parse_int(_pick(row, "월세금액", "월세", "monthlyRent"))
    contract_year_month_value = _pick_year_month(row)
    contract_year_month = _parse_year_month(contract_year_month_value)

    normalized = {
        "source_type": normalized_source_type,
        "rent_type": RentType.jeonse if monthly_rent == 0 else RentType.monthly,
        "region_sido": _pick(row, "시도", "지역시도"),
        "region_sigungu": _pick(row, "시군구", "지역시군구", "sggNm"),
        "region_dong": _pick_optional(row, "법정동", "동", "umdNm"),
        "region_code_5": _pick(row, "지역코드", "법정동시군구코드", "LAWD_CD", "sggCd"),
        "building_name": _pick(row, "아파트", "단지명", "오피스텔", "건물명", "aptNm", "offiNm"),
        "address_jibun": _pick_optional(row, "지번", "jibun"),
        "area_m2": Decimal(_pick(row, "전용면적", "전용면적(㎡)", "excluUseAr").replace(",", "")),
        "floor": _parse_optional_int(_pick_optional(row, "층", "floor")),
        "built_year": _parse_optional_int(_pick_optional(row, "건축년도", "건축연도", "buildYear")),
        "contract_date": _parse_contract_date(contract_year_month_value, _pick(row, "계약일", "dealDay")),
        "contract_year_month": contract_year_month,
        "deposit_amount_manwon": _parse_int(_pick(row, "보증금액", "보증금", "deposit")),
        "monthly_rent_manwon": monthly_rent,
        "raw_payload": row,
    }
    normalized["source_hash"] = _build_source_hash(normalized_source_type, row)
    return normalized


def _pick(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        value = row.get(key)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    joined = ", ".join(keys)
    raise ValueError(f"Missing required rental transaction field: {joined}")


def _pick_optional(row: dict[str, str], *keys: str) -> str | None:
    for key in keys:
        value = row.get(key)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return None


def _pick_year_month(row: dict[str, str]) -> str:
    compact = _pick_optional(row, "계약년월")
    if compact:
        return compact
    year = _pick(row, "dealYear")
    month = _pick(row, "dealMonth")
    return f"{int(year):04d}{int(month):02d}"


def _parse_int(value: str) -> int:
    return int(value.replace(",", "").strip())


def _parse_optional_int(value: str | None) -> int | None:
    if value is None:
        return None
    stripped = value.replace(",", "").strip()
    if not stripped:
        return None
    return int(stripped)


def _parse_year_month(value: str) -> str:
    compact = value.strip().replace("-", "")
    if len(compact) != 6 or not compact.isdigit():
        raise ValueError("계약년월 must be in YYYYMM format")
    return f"{compact[:4]}-{compact[4:]}"


def _parse_contract_date(year_month: str, day: str) -> date:
    compact = year_month.strip().replace("-", "")
    if len(compact) != 6 or not compact.isdigit():
        raise ValueError("계약년월 must be in YYYYMM format")
    return date(int(compact[:4]), int(compact[4:]), int(day.strip()))


def _build_source_hash(source_type: HousingType, row: dict[str, str]) -> str:
    payload = {
        "source_type": source_type.value,
        "row": row,
    }
    serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
