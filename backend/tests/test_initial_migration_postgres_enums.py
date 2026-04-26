from pathlib import Path


def test_initial_migration_reuses_precreated_postgres_enums_without_duplicate_create_type():
    migration = Path("alembic/versions/20260425_0001_initial_schema.py").read_text()

    assert "from sqlalchemy.dialects import postgresql" in migration
    assert "postgresql.ENUM" in migration
    assert "create_type=False" in migration
