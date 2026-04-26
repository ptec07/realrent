from app.config import Settings


def test_settings_has_database_url():
    settings = Settings(database_url="postgresql+psycopg://user:pass@localhost:5432/realrent")

    assert settings.database_url.startswith("postgresql")
