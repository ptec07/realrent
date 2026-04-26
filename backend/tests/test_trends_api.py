from datetime import date
from decimal import Decimal

from app.models.enums import HousingType, RentType
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.rental_transaction import RentalTransaction


def add_monthly_summary(db_session, **overrides):
    defaults = {
        "region_code_5": "11200",
        "region_sido": "서울특별시",
        "region_sigungu": "성동구",
        "region_dong": "성수동",
        "source_type": HousingType.apartment,
        "rent_type": RentType.monthly,
        "month_label": "2026-03",
        "transaction_count": 10,
        "avg_deposit_manwon": 12000,
        "avg_monthly_rent_manwon": 70,
        "avg_area_m2": Decimal("61.50"),
        "min_deposit_manwon": 9000,
        "max_deposit_manwon": 18000,
        "min_monthly_rent_manwon": 50,
        "max_monthly_rent_manwon": 100,
    }
    defaults.update(overrides)
    summary = MonthlyRegionSummary(**defaults)
    db_session.add(summary)
    db_session.flush()
    return summary


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


def test_trends_api_prefers_monthly_summaries(client, db_session):
    add_monthly_summary(db_session, month_label="2026-02", transaction_count=7, avg_deposit_manwon=11000, avg_monthly_rent_manwon=65, avg_area_m2=Decimal("60.50"))
    add_monthly_summary(db_session, month_label="2026-03", transaction_count=10, avg_deposit_manwon=12000, avg_monthly_rent_manwon=70, avg_area_m2=Decimal("61.50"))
    add_transaction(db_session, deposit_amount_manwon=99999, monthly_rent_manwon=999, source_hash="ignored-live-transaction")
    db_session.commit()

    response = client.get(
        "/api/trends",
        params={"regionCode5": "11200", "sourceType": "apartment", "rentType": "monthly", "months": 2},
    )

    assert response.status_code == 200
    assert response.json() == {
        "regionCode5": "11200",
        "sourceType": "apartment",
        "rentType": "monthly",
        "months": 2,
        "points": [
            {
                "month": "2026-02",
                "transactionCount": 7,
                "avgDepositManwon": 11000,
                "avgMonthlyRentManwon": 65,
                "avgAreaM2": "60.50",
            },
            {
                "month": "2026-03",
                "transactionCount": 10,
                "avgDepositManwon": 12000,
                "avgMonthlyRentManwon": 70,
                "avgAreaM2": "61.50",
            },
        ],
    }


def test_trends_api_falls_back_to_live_transaction_aggregation(client, db_session):
    add_transaction(db_session, contract_year_month="2026-03", deposit_amount_manwon=10000, monthly_rent_manwon=60, area_m2=Decimal("60.00"), source_hash="mar-1")
    add_transaction(db_session, contract_year_month="2026-03", deposit_amount_manwon=20000, monthly_rent_manwon=90, area_m2=Decimal("70.00"), source_hash="mar-2")
    add_transaction(db_session, contract_year_month="2026-02", deposit_amount_manwon=9000, monthly_rent_manwon=50, area_m2=Decimal("55.00"), source_hash="feb")
    db_session.commit()

    response = client.get(
        "/api/trends",
        params={"regionCode5": "11200", "sourceType": "apartment", "rentType": "monthly", "months": 2},
    )

    assert response.status_code == 200
    assert response.json()["points"] == [
        {
            "month": "2026-02",
            "transactionCount": 1,
            "avgDepositManwon": 9000,
            "avgMonthlyRentManwon": 50,
            "avgAreaM2": "55.00",
        },
        {
            "month": "2026-03",
            "transactionCount": 2,
            "avgDepositManwon": 15000,
            "avgMonthlyRentManwon": 75,
            "avgAreaM2": "65.00",
        },
    ]


def test_trends_api_empty_result_returns_empty_points(client):
    response = client.get(
        "/api/trends",
        params={"regionCode5": "99999", "sourceType": "apartment", "rentType": "monthly"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "regionCode5": "99999",
        "sourceType": "apartment",
        "rentType": "monthly",
        "months": 12,
        "points": [],
    }


def test_trends_api_requires_region_code(client):
    response = client.get("/api/trends")

    assert response.status_code == 422
