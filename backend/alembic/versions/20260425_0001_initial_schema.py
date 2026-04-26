"""initial schema

Revision ID: 20260425_0001
Revises:
Create Date: 2026-04-25
"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260425_0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    housing_type = sa.Enum("apartment", "officetel", name="housing_type")
    rent_type = sa.Enum("jeonse", "monthly", name="rent_type")
    sync_status = sa.Enum("pending", "running", "success", "failed", name="sync_status")

    bind = op.get_bind()
    housing_type.create(bind, checkfirst=True)
    rent_type.create(bind, checkfirst=True)
    sync_status.create(bind, checkfirst=True)

    op.create_table(
        "regions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sido_name", sa.String(length=50), nullable=False),
        sa.Column("sigungu_name", sa.String(length=100), nullable=False),
        sa.Column("dong_name", sa.String(length=100), nullable=True),
        sa.Column("region_code_5", sa.String(length=5), nullable=False),
        sa.Column("region_code_full", sa.String(length=20), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("is_target_region", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_regions_region_code_5", "regions", ["region_code_5"])
    op.create_index("idx_regions_full_name", "regions", ["full_name"])
    op.create_index("idx_regions_target", "regions", ["is_target_region"])
    op.create_index("idx_regions_search_names", "regions", ["sido_name", "sigungu_name", "dong_name"])
    op.create_index("uq_regions_code_full", "regions", ["region_code_full"], unique=True, postgresql_where=sa.text("region_code_full IS NOT NULL"))

    op.create_table(
        "rental_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_type", housing_type, nullable=False),
        sa.Column("rent_type", rent_type, nullable=False),
        sa.Column("region_sido", sa.String(length=50), nullable=False),
        sa.Column("region_sigungu", sa.String(length=100), nullable=False),
        sa.Column("region_dong", sa.String(length=100), nullable=True),
        sa.Column("region_code_5", sa.String(length=5), nullable=False),
        sa.Column("building_name", sa.String(length=255), nullable=False),
        sa.Column("address_jibun", sa.String(length=100), nullable=True),
        sa.Column("area_m2", sa.Numeric(10, 2), nullable=False),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("built_year", sa.Integer(), nullable=True),
        sa.Column("contract_date", sa.Date(), nullable=False),
        sa.Column("contract_year_month", sa.String(length=7), nullable=False),
        sa.Column("deposit_amount_manwon", sa.Integer(), nullable=False),
        sa.Column("monthly_rent_manwon", sa.Integer(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("source_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_rental_region_month", "rental_transactions", ["region_code_5", "contract_year_month"])
    op.create_index("idx_rental_region_type_rent", "rental_transactions", ["region_code_5", "source_type", "rent_type"])
    op.create_index("idx_rental_contract_date", "rental_transactions", ["contract_date"])
    op.create_index("idx_rental_budget", "rental_transactions", ["deposit_amount_manwon", "monthly_rent_manwon"])
    op.create_index("idx_rental_area", "rental_transactions", ["area_m2"])
    op.create_index("idx_rental_building", "rental_transactions", ["building_name"])
    op.create_index("uq_rental_source_hash", "rental_transactions", ["source_hash"], unique=True)

    op.create_table(
        "monthly_region_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("region_code_5", sa.String(length=5), nullable=False),
        sa.Column("region_sido", sa.String(length=50), nullable=False),
        sa.Column("region_sigungu", sa.String(length=100), nullable=False),
        sa.Column("region_dong", sa.String(length=100), nullable=True),
        sa.Column("source_type", housing_type, nullable=False),
        sa.Column("rent_type", rent_type, nullable=False),
        sa.Column("month_label", sa.String(length=7), nullable=False),
        sa.Column("transaction_count", sa.Integer(), nullable=False),
        sa.Column("avg_deposit_manwon", sa.Integer(), nullable=True),
        sa.Column("avg_monthly_rent_manwon", sa.Integer(), nullable=True),
        sa.Column("avg_area_m2", sa.Numeric(10, 2), nullable=True),
        sa.Column("min_deposit_manwon", sa.Integer(), nullable=True),
        sa.Column("max_deposit_manwon", sa.Integer(), nullable=True),
        sa.Column("min_monthly_rent_manwon", sa.Integer(), nullable=True),
        sa.Column("max_monthly_rent_manwon", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_monthly_summary_region", "monthly_region_summaries", ["region_code_5"])
    op.create_index("idx_monthly_summary_region_type_month", "monthly_region_summaries", ["region_code_5", "source_type", "rent_type", "month_label"])
    op.create_index("uq_monthly_summary_key", "monthly_region_summaries", ["region_code_5", "source_type", "rent_type", "month_label"], unique=True)

    op.create_table(
        "data_sync_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_type", housing_type, nullable=False),
        sa.Column("region_code_5", sa.String(length=5), nullable=False),
        sa.Column("target_year_month", sa.String(length=6), nullable=False),
        sa.Column("status", sync_status, nullable=False),
        sa.Column("fetched_count", sa.Integer(), nullable=False),
        sa.Column("inserted_count", sa.Integer(), nullable=False),
        sa.Column("skipped_count", sa.Integer(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_sync_jobs_status", "data_sync_jobs", ["status"])
    op.create_index("idx_sync_jobs_target", "data_sync_jobs", ["source_type", "region_code_5", "target_year_month"])
    op.create_index("uq_sync_job_target", "data_sync_jobs", ["source_type", "region_code_5", "target_year_month"], unique=True)


def downgrade() -> None:
    op.drop_index("uq_sync_job_target", table_name="data_sync_jobs")
    op.drop_index("idx_sync_jobs_target", table_name="data_sync_jobs")
    op.drop_index("idx_sync_jobs_status", table_name="data_sync_jobs")
    op.drop_table("data_sync_jobs")

    op.drop_index("uq_monthly_summary_key", table_name="monthly_region_summaries")
    op.drop_index("idx_monthly_summary_region_type_month", table_name="monthly_region_summaries")
    op.drop_index("idx_monthly_summary_region", table_name="monthly_region_summaries")
    op.drop_table("monthly_region_summaries")

    op.drop_index("uq_rental_source_hash", table_name="rental_transactions")
    op.drop_index("idx_rental_building", table_name="rental_transactions")
    op.drop_index("idx_rental_area", table_name="rental_transactions")
    op.drop_index("idx_rental_budget", table_name="rental_transactions")
    op.drop_index("idx_rental_contract_date", table_name="rental_transactions")
    op.drop_index("idx_rental_region_type_rent", table_name="rental_transactions")
    op.drop_index("idx_rental_region_month", table_name="rental_transactions")
    op.drop_table("rental_transactions")

    op.drop_index("uq_regions_code_full", table_name="regions")
    op.drop_index("idx_regions_search_names", table_name="regions")
    op.drop_index("idx_regions_target", table_name="regions")
    op.drop_index("idx_regions_full_name", table_name="regions")
    op.drop_index("idx_regions_region_code_5", table_name="regions")
    op.drop_table("regions")

    bind = op.get_bind()
    sa.Enum(name="sync_status").drop(bind, checkfirst=True)
    sa.Enum(name="rent_type").drop(bind, checkfirst=True)
    sa.Enum(name="housing_type").drop(bind, checkfirst=True)
