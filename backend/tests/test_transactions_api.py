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
        "area_m2": Decimal("59.84"),
        "floor": 12,
        "built_year": 2015,
        "contract_date": date(2026, 3, 7),
        "contract_year_month": "2026-03",
        "deposit_amount_manwon": 10000,
        "monthly_rent_manwon": 65,
        "raw_payload": {"source": "test"},
        "source_hash": "hash-1",
    }
    defaults.update(overrides)
    transaction = RentalTransaction(**defaults)
    db_session.add(transaction)
    db_session.flush()
    return transaction


def test_transactions_api_filters_and_serializes_items(client, db_session):
    add_transaction(db_session, source_hash="match")
    add_transaction(
        db_session,
        region_dong="왕십리동",
        deposit_amount_manwon=30000,
        monthly_rent_manwon=0,
        rent_type=RentType.jeonse,
        source_hash="wrong-dong",
    )
    db_session.commit()

    response = client.get(
        "/api/transactions",
        params={
            "regionCode5": "11200",
            "dong": "성수동",
            "sourceType": "apartment",
            "rentType": "monthly",
            "depositMax": 12000,
            "monthlyRentMax": 70,
            "page": 1,
            "pageSize": 20,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "id": 1,
                "sourceType": "apartment",
                "rentType": "monthly",
                "regionSido": "서울특별시",
                "regionSigungu": "성동구",
                "regionDong": "성수동",
                "regionCode5": "11200",
                "buildingName": "서울숲리버뷰",
                "addressJibun": "123-4",
                "areaM2": "59.84",
                "floor": 12,
                "builtYear": 2015,
                "contractDate": "2026-03-07",
                "contractYearMonth": "2026-03",
                "depositAmountManwon": 10000,
                "monthlyRentManwon": 65,
            }
        ],
        "page": 1,
        "pageSize": 20,
        "total": 1,
    }


def test_transactions_api_sorts_and_paginates(client, db_session):
    add_transaction(db_session, building_name="비싼집", deposit_amount_manwon=30000, monthly_rent_manwon=90, source_hash="expensive")
    add_transaction(db_session, building_name="저렴한집", deposit_amount_manwon=8000, monthly_rent_manwon=80, source_hash="cheap")
    add_transaction(db_session, building_name="중간집", deposit_amount_manwon=15000, monthly_rent_manwon=70, source_hash="middle")
    db_session.commit()

    response = client.get(
        "/api/transactions",
        params={"regionCode5": "11200", "sort": "deposit_asc", "page": 2, "pageSize": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 3
    assert payload["page"] == 2
    assert payload["pageSize"] == 1
    assert [item["buildingName"] for item in payload["items"]] == ["중간집"]


def test_transactions_api_rent_type_all_does_not_filter_rent_type(client, db_session):
    add_transaction(db_session, rent_type=RentType.monthly, monthly_rent_manwon=65, source_hash="monthly")
    add_transaction(db_session, rent_type=RentType.jeonse, monthly_rent_manwon=0, source_hash="jeonse")
    db_session.commit()

    response = client.get("/api/transactions", params={"regionCode5": "11200", "rentType": "all"})

    assert response.status_code == 200
    assert response.json()["total"] == 2


def test_transactions_api_requires_region_code(client):
    response = client.get("/api/transactions")

    assert response.status_code == 422
