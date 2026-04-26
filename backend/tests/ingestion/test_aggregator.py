from datetime import date
from decimal import Decimal

from app.ingestion.aggregator import aggregate_monthly_region_summaries
from app.models.enums import HousingType, RentType
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.rental_transaction import RentalTransaction


def test_aggregate_monthly_region_summaries_groups_transactions(db_session):
    db_session.add_all(
        [
            _transaction(
                source_hash="a-1",
                region_code_5="11200",
                region_sido="서울특별시",
                region_sigungu="성동구",
                region_dong="성수동",
                source_type=HousingType.apartment,
                rent_type=RentType.monthly,
                contract_year_month="2025-01",
                contract_date=date(2025, 1, 3),
                deposit_amount_manwon=10_000,
                monthly_rent_manwon=70,
                area_m2=Decimal("40.00"),
            ),
            _transaction(
                source_hash="a-2",
                region_code_5="11200",
                region_sido="서울특별시",
                region_sigungu="성동구",
                region_dong="성수동",
                source_type=HousingType.apartment,
                rent_type=RentType.monthly,
                contract_year_month="2025-01",
                contract_date=date(2025, 1, 18),
                deposit_amount_manwon=20_001,
                monthly_rent_manwon=90,
                area_m2=Decimal("50.01"),
            ),
            _transaction(
                source_hash="b-1",
                region_code_5="11200",
                region_sido="서울특별시",
                region_sigungu="성동구",
                region_dong="성수동",
                source_type=HousingType.apartment,
                rent_type=RentType.jeonse,
                contract_year_month="2025-01",
                contract_date=date(2025, 1, 9),
                deposit_amount_manwon=50_000,
                monthly_rent_manwon=0,
                area_m2=Decimal("84.50"),
            ),
            _transaction(
                source_hash="c-1",
                region_code_5="11230",
                region_sido="서울특별시",
                region_sigungu="동대문구",
                region_dong="답십리동",
                source_type=HousingType.officetel,
                rent_type=RentType.monthly,
                contract_year_month="2025-02",
                contract_date=date(2025, 2, 1),
                deposit_amount_manwon=1_000,
                monthly_rent_manwon=60,
                area_m2=Decimal("24.20"),
            ),
        ]
    )
    db_session.commit()

    result = aggregate_monthly_region_summaries(db_session)

    assert result.created_count == 3
    assert result.summary_count == 3

    monthly = _summary(db_session, "11200", HousingType.apartment, RentType.monthly, "2025-01")
    assert monthly.transaction_count == 2
    assert monthly.region_sido == "서울특별시"
    assert monthly.region_sigungu == "성동구"
    assert monthly.region_dong == "성수동"
    assert monthly.avg_deposit_manwon == 15_001
    assert monthly.avg_monthly_rent_manwon == 80
    assert monthly.avg_area_m2 == Decimal("45.01")
    assert monthly.min_deposit_manwon == 10_000
    assert monthly.max_deposit_manwon == 20_001
    assert monthly.min_monthly_rent_manwon == 70
    assert monthly.max_monthly_rent_manwon == 90


def test_aggregate_monthly_region_summaries_replaces_existing_matching_summary(db_session):
    db_session.add(
        MonthlyRegionSummary(
            region_code_5="11200",
            region_sido="old",
            region_sigungu="old",
            region_dong="old",
            source_type=HousingType.apartment,
            rent_type=RentType.monthly,
            month_label="2025-01",
            transaction_count=99,
            avg_deposit_manwon=1,
            avg_monthly_rent_manwon=1,
            avg_area_m2=Decimal("1.00"),
            min_deposit_manwon=1,
            max_deposit_manwon=1,
            min_monthly_rent_manwon=1,
            max_monthly_rent_manwon=1,
        )
    )
    db_session.add(
        _transaction(
            source_hash="replace-1",
            region_code_5="11200",
            region_sido="서울특별시",
            region_sigungu="성동구",
            region_dong="성수동",
            source_type=HousingType.apartment,
            rent_type=RentType.monthly,
            contract_year_month="2025-01",
            contract_date=date(2025, 1, 1),
            deposit_amount_manwon=30_000,
            monthly_rent_manwon=110,
            area_m2=Decimal("59.99"),
        )
    )
    db_session.commit()

    result = aggregate_monthly_region_summaries(db_session)

    assert result.created_count == 1
    assert db_session.query(MonthlyRegionSummary).count() == 1
    summary = _summary(db_session, "11200", HousingType.apartment, RentType.monthly, "2025-01")
    assert summary.transaction_count == 1
    assert summary.avg_deposit_manwon == 30_000
    assert summary.avg_monthly_rent_manwon == 110
    assert summary.avg_area_m2 == Decimal("59.99")


def test_aggregate_monthly_region_summaries_can_limit_to_target_month(db_session):
    db_session.add_all(
        [
            _transaction(
                source_hash="jan",
                contract_year_month="2025-01",
                contract_date=date(2025, 1, 2),
            ),
            _transaction(
                source_hash="feb",
                contract_year_month="2025-02",
                contract_date=date(2025, 2, 2),
            ),
        ]
    )
    db_session.commit()

    result = aggregate_monthly_region_summaries(db_session, month_label="2025-02")

    assert result.created_count == 1
    assert _summary(db_session, "11200", HousingType.apartment, RentType.monthly, "2025-02").transaction_count == 1
    assert (
        db_session.query(MonthlyRegionSummary)
        .filter(MonthlyRegionSummary.month_label == "2025-01")
        .one_or_none()
        is None
    )


def _transaction(
    *,
    source_hash: str,
    region_code_5: str = "11200",
    region_sido: str = "서울특별시",
    region_sigungu: str = "성동구",
    region_dong: str | None = "성수동",
    source_type: HousingType = HousingType.apartment,
    rent_type: RentType = RentType.monthly,
    contract_year_month: str = "2025-01",
    contract_date: date = date(2025, 1, 1),
    deposit_amount_manwon: int = 10_000,
    monthly_rent_manwon: int = 70,
    area_m2: Decimal = Decimal("40.00"),
) -> RentalTransaction:
    return RentalTransaction(
        source_type=source_type,
        rent_type=rent_type,
        region_sido=region_sido,
        region_sigungu=region_sigungu,
        region_dong=region_dong,
        region_code_5=region_code_5,
        building_name="테스트아파트",
        address_jibun="1-1",
        area_m2=area_m2,
        floor=3,
        built_year=2005,
        contract_date=contract_date,
        contract_year_month=contract_year_month,
        deposit_amount_manwon=deposit_amount_manwon,
        monthly_rent_manwon=monthly_rent_manwon,
        raw_payload={"source_hash": source_hash},
        source_hash=source_hash,
    )


def _summary(
    db_session,
    region_code_5: str,
    source_type: HousingType,
    rent_type: RentType,
    month_label: str,
) -> MonthlyRegionSummary:
    return (
        db_session.query(MonthlyRegionSummary)
        .filter(
            MonthlyRegionSummary.region_code_5 == region_code_5,
            MonthlyRegionSummary.source_type == source_type,
            MonthlyRegionSummary.rent_type == rent_type,
            MonthlyRegionSummary.month_label == month_label,
        )
        .one()
    )
