from app.api.routes import admin_ingestion


def test_admin_ingest_requires_configured_token(client, monkeypatch):
    monkeypatch.setattr(admin_ingestion.settings, "ingest_admin_token", None)

    response = client.post(
        "/api/admin/ingest",
        json={
            "sourceType": "apartment",
            "regionCode5": "11680",
            "month": "2025-01",
            "regionSido": "서울특별시",
            "regionSigungu": "강남구",
        },
    )

    assert response.status_code == 403


def test_admin_ingest_rejects_wrong_token(client, monkeypatch):
    monkeypatch.setattr(admin_ingestion.settings, "ingest_admin_token", "secret")

    response = client.post(
        "/api/admin/ingest",
        headers={"x-realrent-admin-token": "wrong"},
        json={
            "sourceType": "apartment",
            "regionCode5": "11680",
            "month": "2025-01",
            "regionSido": "서울특별시",
            "regionSigungu": "강남구",
        },
    )

    assert response.status_code == 403


def test_admin_ingest_runs_ingestion_with_valid_token(client, monkeypatch):
    monkeypatch.setattr(admin_ingestion.settings, "ingest_admin_token", "secret")
    calls = []

    def fake_ingest(db, **kwargs):
        calls.append(kwargs)
        return admin_ingestion.IngestionResult(
            fetched_count=3,
            inserted_count=2,
            skipped_duplicate_count=1,
            summary_count=2,
        )

    monkeypatch.setattr(admin_ingestion, "ingest_rent_transactions", fake_ingest)

    response = client.post(
        "/api/admin/ingest",
        headers={"x-realrent-admin-token": "secret"},
        json={
            "sourceType": "apartment",
            "regionCode5": "11680",
            "month": "2025-01",
            "regionSido": "서울특별시",
            "regionSigungu": "강남구",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "fetchedCount": 3,
        "insertedCount": 2,
        "skippedDuplicateCount": 1,
        "summaryCount": 2,
    }
    assert calls == [
        {
            "source_type": "apartment",
            "region_code_5": "11680",
            "contract_year_month": "2025-01",
            "region_sido": "서울특별시",
            "region_sigungu": "강남구",
        }
    ]


def test_admin_ingest_can_run_sale_ingestion_with_valid_token(client, monkeypatch):
    monkeypatch.setattr(admin_ingestion.settings, "ingest_admin_token", "secret")
    calls = []

    def fake_sale_ingest(db, **kwargs):
        calls.append(kwargs)
        return admin_ingestion.IngestionResult(
            fetched_count=4,
            inserted_count=4,
            skipped_duplicate_count=0,
            summary_count=1,
        )

    monkeypatch.setattr(admin_ingestion, "ingest_sale_transactions", fake_sale_ingest)

    response = client.post(
        "/api/admin/ingest",
        headers={"x-realrent-admin-token": "secret"},
        json={
            "transactionKind": "sale",
            "sourceType": "apartment",
            "regionCode5": "11680",
            "month": "2025-01",
            "regionSido": "서울특별시",
            "regionSigungu": "강남구",
        },
    )

    assert response.status_code == 200
    assert response.json()["insertedCount"] == 4
    assert calls == [
        {
            "source_type": "apartment",
            "region_code_5": "11680",
            "contract_year_month": "2025-01",
            "region_sido": "서울특별시",
            "region_sigungu": "강남구",
        }
    ]
