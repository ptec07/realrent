from pathlib import Path


def test_alembic_configuration_files_exist():
    backend_root = Path(__file__).resolve().parents[1]

    assert (backend_root / "alembic.ini").is_file()
    assert (backend_root / "alembic" / "env.py").is_file()
    assert (backend_root / "alembic" / "script.py.mako").is_file()


def test_initial_migration_contains_core_tables():
    backend_root = Path(__file__).resolve().parents[1]
    migration_files = sorted((backend_root / "alembic" / "versions").glob("*_initial_schema.py"))

    assert migration_files, "initial schema migration should exist"

    content = migration_files[0].read_text(encoding="utf-8")
    for table_name in [
        "regions",
        "rental_transactions",
        "monthly_region_summaries",
        "data_sync_jobs",
    ]:
        assert table_name in content


def test_alembic_env_uses_app_metadata():
    backend_root = Path(__file__).resolve().parents[1]
    env_content = (backend_root / "alembic" / "env.py").read_text(encoding="utf-8")

    assert "from app.database import Base" in env_content
    assert "target_metadata = Base.metadata" in env_content
    assert "app.models" in env_content
