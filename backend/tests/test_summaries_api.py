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
        "deposit_amount_manwon": 10000,
        "monthly_rent_manwon": 60,
        "raw_payload": {"source": "test"},
        "source_hash": "hash-1",
    }
    defaults.update(overrides)
    transaction = RentalTransaction(**defaults)
    db_session.add(transaction)
    db_session.flush()
    return transaction


def test_summary_api_returns_averages_latest_month_and_sample_warning(client, db_session):
    add_transaction(db_session, source_hash="tx-1")
    add_transaction(
        db_session,
        area_m2=Decimal("70.00"),
        deposit_amount_manwon=20000,
        monthly_rent_manwon=90,
        contract_date=date(2026, 2, 10),
        contract_year_month="2026-02",
        source_hash="tx-2",
    )
    add_transaction(
        db_session,
        source_type=HousingType.officetel,
        deposit_amount_manwon=5000,
        monthly_rent_manwon=50,
        source_hash="officetel-ignored",
    )
    db_session.commit()

    response = client.get(
        "/api/summary",
        params={"regionCode5": "11200", "sourceType": "apartment", "rentType": "monthly", "months": 12},
    )

    assert response.status_code == 200
    assert response.json() == {
        "regionCode5": "11200",
        "sourceType": "apartment",
        "rentType": "monthly",
        "months": 12,
        "transactionCount": 2,
        "avgDepositManwon": 15000,
        "avgMonthlyRentManwon": 75,
        "avgAreaM2": "65.00",
        "latestMonth": "2026-03",
        "sampleWarning": "거래 표본이 적어 평균이 왜곡될 수 있습니다.",
    }


def test_summary_api_limits_to_recent_month_window(client, db_session):
    add_transaction(db_session, contract_date=date(2026, 3, 7), contract_year_month="2026-03", source_hash="new")
    add_transaction(
        db_session,
        contract_date=date(2026, 1, 10),
        contract_year_month="2026-01",
        deposit_amount_manwon=50000,
        monthly_rent_manwon=200,
        source_hash="old",
    )
    db_session.commit()

    response = client.get(
        "/api/summary",
        params={"regionCode5": "11200", "sourceType": "apartment", "rentType": "monthly", "months": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["transactionCount"] == 1
    assert payload["avgDepositManwon"] == 10000
    assert payload["avgMonthlyRentManwon"] == 60
    assert payload["latestMonth"] == "2026-03"


def test_summary_api_filters_by_exact_dong_within_same_sigungu(client, db_session):
    add_transaction(
        db_session,
        region_sido="경기도",
        region_sigungu="남양주시",
        region_dong="별내면",
        region_code_5="41360",
        deposit_amount_manwon=40000,
        monthly_rent_manwon=0,
        rent_type=RentType.sale,
        source_hash="byeollae",
    )
    add_transaction(
        db_session,
        region_sido="경기도",
        region_sigungu="남양주시",
        region_dong="다산동",
        region_code_5="41360",
        deposit_amount_manwon=90000,
        monthly_rent_manwon=0,
        rent_type=RentType.sale,
        source_hash="dasan",
    )
    db_session.commit()

    response = client.get(
        "/api/summary",
        params={"regionCode5": "41360", "dong": "별내면", "sourceType": "apartment", "rentType": "sale"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["transactionCount"] == 1
    assert payload["avgDepositManwon"] == 40000


def test_summary_api_empty_result_returns_null_averages(client):
    response = client.get(
        "/api/summary",
        params={"regionCode5": "99999", "sourceType": "apartment", "rentType": "monthly"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "regionCode5": "99999",
        "sourceType": "apartment",
        "rentType": "monthly",
        "months": 12,
        "transactionCount": 0,
        "avgDepositManwon": None,
        "avgMonthlyRentManwon": None,
        "avgAreaM2": None,
        "latestMonth": None,
        "sampleWarning": "거래 표본이 적어 평균이 왜곡될 수 있습니다.",
    }


def test_summary_api_requires_region_code(client):
    response = client.get("/api/summary")

    assert response.status_code == 422
