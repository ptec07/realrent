from app.database import Base
from app.models.data_sync_job import DataSyncJob
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.region import Region
from app.models.rental_transaction import RentalTransaction


def test_models_have_expected_table_names():
    assert Region.__tablename__ == "regions"
    assert RentalTransaction.__tablename__ == "rental_transactions"
    assert MonthlyRegionSummary.__tablename__ == "monthly_region_summaries"
    assert DataSyncJob.__tablename__ == "data_sync_jobs"


def test_model_tables_are_registered_on_base_metadata():
    assert "regions" in Base.metadata.tables
    assert "rental_transactions" in Base.metadata.tables
    assert "monthly_region_summaries" in Base.metadata.tables
    assert "data_sync_jobs" in Base.metadata.tables


def test_region_model_has_core_columns():
    columns = Region.__table__.columns

    assert columns["sido_name"].nullable is False
    assert columns["sigungu_name"].nullable is False
    assert columns["region_code_5"].nullable is False
    assert columns["full_name"].nullable is False
    assert columns["is_target_region"].nullable is False


def test_rental_transaction_model_has_core_columns():
    columns = RentalTransaction.__table__.columns

    assert columns["source_type"].nullable is False
    assert columns["rent_type"].nullable is False
    assert columns["region_code_5"].nullable is False
    assert columns["building_name"].nullable is False
    assert columns["area_m2"].nullable is False
    assert columns["contract_date"].nullable is False
    assert columns["deposit_amount_manwon"].nullable is False
    assert columns["monthly_rent_manwon"].nullable is False
    assert columns["source_hash"].nullable is False


def test_monthly_region_summary_model_has_unique_summary_key_columns():
    columns = MonthlyRegionSummary.__table__.columns

    assert columns["region_code_5"].nullable is False
    assert columns["source_type"].nullable is False
    assert columns["rent_type"].nullable is False
    assert columns["month_label"].nullable is False
    assert columns["transaction_count"].nullable is False


def test_data_sync_job_model_has_status_tracking_columns():
    columns = DataSyncJob.__table__.columns

    assert columns["source_type"].nullable is False
    assert columns["region_code_5"].nullable is False
    assert columns["target_year_month"].nullable is False
    assert columns["status"].nullable is False
    assert columns["fetched_count"].nullable is False
    assert columns["inserted_count"].nullable is False
    assert columns["skipped_count"].nullable is False
