from pathlib import Path


MIGRATION_PATH = Path(__file__).resolve().parents[1] / "alembic" / "versions" / "20260425_0001_initial_schema.py"


def test_initial_migration_reuses_precreated_postgres_enums_without_duplicate_create_type():
    migration = MIGRATION_PATH.read_text()

    assert "from sqlalchemy.dialects import postgresql" in migration
    assert "postgresql.ENUM" in migration
    assert "create_type=False" in migration
