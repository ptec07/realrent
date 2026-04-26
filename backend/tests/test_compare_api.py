from datetime import date
from decimal import Decimal

from app.models.enums import HousingType, RentType
from app.models.rental_transaction import RentalTransaction


def add_transaction(db_session, **overrides):
    defaults = {
        "source_type": HousingType.apartment,
        "rent_type": RentType.monthly,
        "region_sido": "서울특별시",
        "region_sigungu": "성동구",
        "region_dong": "성수동",
        "region_code_5": "11200",
        "building_name": "서울숲리버뷰",
        "address_jibun": "123-4",
        "area_m2": Decimal("60.00"),
        "floor": 12,
        "built_year": 2015,
        "contract_date": date(2026, 3, 7),
        "contract_year_month": "2026-03",
        "deposit_amount_manwon": 20000,
        "monthly_rent_manwon": 90,
        "raw_payload": {"source": "test"},
        "source_hash": "hash-1",
    }
    defaults.update(overrides)
    transaction = RentalTransaction(**defaults)
    db_session.add(transaction)
    db_session.flush()
    return transaction


def test_compare_api_returns_region_summaries_diff_and_insight(client, db_session):
    add_transaction(db_session, source_hash="a-1")
    add_transaction(db_session, deposit_amount_manwon=24000, monthly_rent_manwon=110, source_hash="a-2")
    add_transaction(
        db_session,
        region_sigungu="광진구",
        region_dong="자양동",
        region_code_5="11230",
        deposit_amount_manwon=15000,
        monthly_rent_manwon=70,
        source_hash="b-1",
    )
    add_transaction(
        db_session,
        region_sigungu="광진구",
        region_dong="자양동",
        region_code_5="11230",
        deposit_amount_manwon=17000,
        monthly_rent_manwon=80,
        source_hash="b-2",
    )
    db_session.commit()

    response = client.get(
        "/api/compare",
        params={"regionA": "11200", "regionB": "11230", "sourceType": "apartment", "rentType": "monthly", "months": 3},
    )

    assert response.status_code == 200
    assert response.json() == {
        "regionA": {
            "regionCode5": "11200",
            "transactionCount": 2,
            "avgDepositManwon": 22000,
            "avgMonthlyRentManwon": 100,
            "avgAreaM2": "60.00",
            "latestMonth": "2026-03",
        },
        "regionB": {
            "regionCode5": "11230",
            "transactionCount": 2,
            "avgDepositManwon": 16000,
            "avgMonthlyRentManwon": 75,
            "avgAreaM2": "60.00",
            "latestMonth": "2026-03",
        },
        "diff": {
            "depositManwon": -6000,
            "monthlyRentManwon": -25,
        },
        "insight": "B가 A보다 평균 보증금과 월세가 낮습니다.",
    }


def test_compare_api_handles_missing_region_data(client, db_session):
    add_transaction(db_session, source_hash="a-only")
    db_session.commit()

    response = client.get(
        "/api/compare",
        params={"regionA": "11200", "regionB": "99999", "sourceType": "apartment", "rentType": "monthly"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["regionA"]["transactionCount"] == 1
    assert payload["regionB"] == {
        "regionCode5": "99999",
        "transactionCount": 0,
        "avgDepositManwon": None,
        "avgMonthlyRentManwon": None,
        "avgAreaM2": None,
        "latestMonth": None,
    }
    assert payload["diff"] == {"depositManwon": None, "monthlyRentManwon": None}
    assert payload["insight"] == "비교할 거래 표본이 부족합니다."


def test_compare_api_requires_two_regions(client):
    response = client.get("/api/compare", params={"regionA": "11200"})

    assert response.status_code == 422
