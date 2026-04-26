from datetime import date
from decimal import Decimal

from app.ingestion.normalizer import normalize_rental_transaction
from app.models.enums import HousingType, RentType


BASE_ROW = {
    "시도": "서울특별시",
    "시군구": "성동구",
    "법정동": "성수동",
    "지역코드": "11200",
    "아파트": "서울숲리버뷰",
    "지번": "123-4",
    "전용면적": "59.84",
    "층": "12",
    "건축년도": "2015",
    "계약년월": "202603",
    "계약일": "7",
    "보증금액": "10,000",
    "월세금액": "65",
}


def test_normalize_monthly_apartment_transaction():
    normalized = normalize_rental_transaction(BASE_ROW, source_type=HousingType.apartment)

    assert normalized == {
        "source_type": HousingType.apartment,
        "rent_type": RentType.monthly,
        "region_sido": "서울특별시",
        "region_sigungu": "성동구",
        "region_dong": "성수동",
        "region_code_5": "11200",
        "building_name": "서울숲리버뷰",
        "address_jibun": "123-4",
        "area_m2": Decimal("59.84"),
        "floor": 12,
        "built_year": 2015,
        "contract_date": date(2026, 3, 7),
        "contract_year_month": "2026-03",
        "deposit_amount_manwon": 10000,
        "monthly_rent_manwon": 65,
        "raw_payload": BASE_ROW,
        "source_hash": normalized["source_hash"],
    }
    assert len(normalized["source_hash"]) == 64


def test_normalize_zero_monthly_rent_as_jeonse():
    row = {**BASE_ROW, "월세금액": "0", "보증금액": "50,000"}

    normalized = normalize_rental_transaction(row, source_type=HousingType.officetel)

    assert normalized["source_type"] == HousingType.officetel
    assert normalized["rent_type"] == RentType.jeonse
    assert normalized["deposit_amount_manwon"] == 50000
    assert normalized["monthly_rent_manwon"] == 0


def test_normalize_source_hash_is_deterministic_and_changes_with_source_type():
    first = normalize_rental_transaction(BASE_ROW, source_type=HousingType.apartment)
    second = normalize_rental_transaction(dict(reversed(BASE_ROW.items())), source_type=HousingType.apartment)
    officetel = normalize_rental_transaction(BASE_ROW, source_type=HousingType.officetel)

    assert first["source_hash"] == second["source_hash"]
    assert first["source_hash"] != officetel["source_hash"]


def test_normalize_handles_blank_optional_numeric_fields():
    row = {**BASE_ROW, "층": " ", "건축년도": ""}

    normalized = normalize_rental_transaction(row, source_type=HousingType.apartment)

    assert normalized["floor"] is None
    assert normalized["built_year"] is None


def test_normalize_handles_current_molit_english_xml_tags():
    row = {
        "시도": "서울특별시",
        "sggNm": "강남구",
        "umdNm": "개포동",
        "sggCd": "11680",
        "aptNm": "현대2",
        "jibun": "654",
        "excluUseAr": "84.81",
        "floor": "7",
        "buildYear": "1986",
        "dealYear": "2025",
        "dealMonth": "1",
        "dealDay": "11",
        "deposit": "85,000",
        "monthlyRent": "0",
    }

    normalized = normalize_rental_transaction(row, source_type=HousingType.apartment)

    assert normalized["region_sigungu"] == "강남구"
    assert normalized["region_dong"] == "개포동"
    assert normalized["region_code_5"] == "11680"
    assert normalized["building_name"] == "현대2"
    assert normalized["address_jibun"] == "654"
    assert normalized["area_m2"] == Decimal("84.81")
    assert normalized["floor"] == 7
    assert normalized["built_year"] == 1986
    assert normalized["contract_date"] == date(2025, 1, 11)
    assert normalized["contract_year_month"] == "2025-01"
    assert normalized["deposit_amount_manwon"] == 85000
    assert normalized["monthly_rent_manwon"] == 0
    assert normalized["rent_type"] == RentType.jeonse
