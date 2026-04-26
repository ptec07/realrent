# RealRent MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build RealRent, a Seoul metro area apartment/officetel rental transaction comparison web app.

**Architecture:** FastAPI backend exposes region search, transaction search, summary, trend, and comparison APIs. PostgreSQL stores normalized public rental transaction data and monthly summaries. React/Vite frontend consumes these APIs and renders search, filters, summaries, charts, and region comparison views.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest, Vite, React, TypeScript, TanStack Query, Recharts.

---

## MVP Scope

### Included

- Region: Seoul, Gyeonggi-do, Incheon only.
- Housing types: apartments and officetels.
- Rent types: jeonse and monthly rent.
- Platform: responsive web MVP.
- Core capabilities:
  - Region search.
  - Transaction list filtering.
  - Budget filtering.
  - Summary cards.
  - Monthly price trend chart.
  - Two-region comparison.

### Excluded from MVP

- Login and accounts.
- Favorite regions.
- Alerts.
- AI recommendations.
- Brokerage or listings.
- Sale transaction data.
- Row-house/multiplex housing.
- Map pin visualization.

---

## Public Data Sources

### Apartment rent transactions

- Dataset: `국토교통부_아파트 전월세 실거래가 자료`
- Data page: `https://www.data.go.kr/data/15126474/openapi.do`
- Auth: public data portal service key.
- Response format: XML.
- Typical query fields to verify in Swagger:
  - `serviceKey`
  - `LAWD_CD` or equivalent region code parameter.
  - `DEAL_YMD` or equivalent contract year-month parameter.
  - `pageNo`
  - `numOfRows`

### Officetel rent transactions

- Dataset: `국토교통부_오피스텔 전월세 실거래가 자료`
- Data page: `https://www.data.go.kr/data/15126475/openapi.do`
- Auth: public data portal service key.
- Response format: XML.
- Typical query fields to verify in Swagger:
  - `serviceKey`
  - `LAWD_CD` or equivalent region code parameter.
  - `DEAL_YMD` or equivalent contract year-month parameter.
  - `pageNo`
  - `numOfRows`

### Region codes

- Candidate: `행정안전부_행정표준코드_법정동코드`
- Candidate URL: `https://www.data.go.kr/data/15077871/openapi.do`
- Alternative: `국토교통부_법정동코드` file data.
- MVP needs Seoul, Gyeonggi-do, and Incheon region codes only.

---

## Repository Structure

```text
realrent/
  README.md
  .env.example
  docker-compose.yml
  Makefile

  backend/
    pyproject.toml
    alembic.ini
    pytest.ini

    app/
      __init__.py
      main.py
      config.py
      database.py

      api/
        __init__.py
        routes/
          __init__.py
          health.py
          regions.py
          transactions.py
          summaries.py
          trends.py
          compare.py
          meta.py

      models/
        __init__.py
        region.py
        rental_transaction.py
        monthly_region_summary.py
        data_sync_job.py

      schemas/
        __init__.py
        region.py
        transaction.py
        summary.py
        trend.py
        compare.py
        meta.py

      services/
        __init__.py
        region_search_service.py
        transaction_query_service.py
        summary_service.py
        trend_service.py
        compare_service.py
        filter_meta_service.py

      ingestion/
        __init__.py
        molit_client.py
        apartment_rent_fetcher.py
        officetel_rent_fetcher.py
        region_code_loader.py
        xml_parser.py
        normalizer.py
        aggregator.py
        sync_runner.py

      utils/
        __init__.py
        money.py
        dates.py
        pagination.py

    alembic/
      versions/
      env.py
      script.py.mako

    tests/
      conftest.py
      api/
        test_health.py
        test_regions.py
        test_transactions.py
        test_summaries.py
        test_trends.py
        test_compare.py
      services/
        test_region_search_service.py
        test_transaction_query_service.py
        test_compare_service.py
      ingestion/
        test_xml_parser.py
        test_normalizer.py
        test_aggregator.py

  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    index.html

    src/
      main.tsx
      App.tsx

      api/
        client.ts
        regions.ts
        transactions.ts
        summaries.ts
        trends.ts
        compare.ts
        meta.ts

      routes/
        HomePage.tsx
        SearchResultsPage.tsx
        ComparePage.tsx

      components/
        layout/
          AppShell.tsx
          Header.tsx
        search/
          RegionSearchBox.tsx
          QuickRegionButtons.tsx
        filters/
          HousingTypeToggle.tsx
          RentTypeToggle.tsx
          BudgetFilterPanel.tsx
          SortSelect.tsx
        summary/
          SummaryCards.tsx
        charts/
          TrendChart.tsx
          CompareTrendChart.tsx
        transactions/
          TransactionList.tsx
          TransactionCard.tsx
          TransactionDetailModal.tsx
        compare/
          CompareRegionPicker.tsx
          CompareSummaryCards.tsx
          CompareInsightText.tsx
        common/
          LoadingState.tsx
          ErrorState.tsx
          EmptyState.tsx
          Badge.tsx

      hooks/
        useRegions.ts
        useTransactions.ts
        useSummary.ts
        useTrends.ts
        useCompare.ts

      types/
        region.ts
        transaction.ts
        summary.ts
        trend.ts
        compare.ts

      utils/
        formatMoney.ts
        formatArea.ts
        queryParams.ts

      styles/
        globals.css
```

---

## Database DDL Draft

```sql
CREATE TYPE housing_type AS ENUM ('apartment', 'officetel');
CREATE TYPE rent_type AS ENUM ('jeonse', 'monthly');
CREATE TYPE sync_status AS ENUM ('pending', 'running', 'success', 'failed');

CREATE TABLE regions (
  id BIGSERIAL PRIMARY KEY,
  sido_name VARCHAR(50) NOT NULL,
  sigungu_name VARCHAR(100) NOT NULL,
  dong_name VARCHAR(100),
  region_code_5 VARCHAR(5) NOT NULL,
  region_code_full VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  is_target_region BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regions_region_code_5 ON regions (region_code_5);
CREATE INDEX idx_regions_full_name ON regions (full_name);
CREATE INDEX idx_regions_target ON regions (is_target_region);
CREATE INDEX idx_regions_search_names ON regions (sido_name, sigungu_name, dong_name);
CREATE UNIQUE INDEX uq_regions_code_full ON regions (region_code_full) WHERE region_code_full IS NOT NULL;

CREATE TABLE rental_transactions (
  id BIGSERIAL PRIMARY KEY,
  source_type housing_type NOT NULL,
  rent_type rent_type NOT NULL,
  region_sido VARCHAR(50) NOT NULL,
  region_sigungu VARCHAR(100) NOT NULL,
  region_dong VARCHAR(100),
  region_code_5 VARCHAR(5) NOT NULL,
  building_name VARCHAR(255) NOT NULL,
  address_jibun VARCHAR(100),
  area_m2 NUMERIC(10, 2) NOT NULL,
  floor INTEGER,
  built_year INTEGER,
  contract_date DATE NOT NULL,
  contract_year_month VARCHAR(7) NOT NULL,
  deposit_amount_manwon INTEGER NOT NULL,
  monthly_rent_manwon INTEGER NOT NULL DEFAULT 0,
  raw_payload JSONB,
  source_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rental_region_month ON rental_transactions (region_code_5, contract_year_month);
CREATE INDEX idx_rental_region_type_rent ON rental_transactions (region_code_5, source_type, rent_type);
CREATE INDEX idx_rental_contract_date ON rental_transactions (contract_date DESC);
CREATE INDEX idx_rental_budget ON rental_transactions (deposit_amount_manwon, monthly_rent_manwon);
CREATE INDEX idx_rental_area ON rental_transactions (area_m2);
CREATE INDEX idx_rental_building ON rental_transactions (building_name);
CREATE UNIQUE INDEX uq_rental_source_hash ON rental_transactions (source_hash);

CREATE TABLE monthly_region_summaries (
  id BIGSERIAL PRIMARY KEY,
  region_code_5 VARCHAR(5) NOT NULL,
  region_sido VARCHAR(50) NOT NULL,
  region_sigungu VARCHAR(100) NOT NULL,
  region_dong VARCHAR(100),
  source_type housing_type NOT NULL,
  rent_type rent_type NOT NULL,
  month_label VARCHAR(7) NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  avg_deposit_manwon INTEGER,
  avg_monthly_rent_manwon INTEGER,
  avg_area_m2 NUMERIC(10, 2),
  min_deposit_manwon INTEGER,
  max_deposit_manwon INTEGER,
  min_monthly_rent_manwon INTEGER,
  max_monthly_rent_manwon INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monthly_summary_region ON monthly_region_summaries (region_code_5);
CREATE INDEX idx_monthly_summary_region_type_month ON monthly_region_summaries (region_code_5, source_type, rent_type, month_label);
CREATE UNIQUE INDEX uq_monthly_summary_key ON monthly_region_summaries (region_code_5, source_type, rent_type, month_label);

CREATE TABLE data_sync_jobs (
  id BIGSERIAL PRIMARY KEY,
  source_type housing_type NOT NULL,
  region_code_5 VARCHAR(5) NOT NULL,
  target_year_month VARCHAR(6) NOT NULL,
  status sync_status NOT NULL DEFAULT 'pending',
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_jobs_status ON data_sync_jobs (status);
CREATE INDEX idx_sync_jobs_target ON data_sync_jobs (source_type, region_code_5, target_year_month);
CREATE UNIQUE INDEX uq_sync_job_target ON data_sync_jobs (source_type, region_code_5, target_year_month);
```

---

## Backend API Draft

### Health

```http
GET /health
```

Response:

```json
{"status":"ok"}
```

### Region search

```http
GET /api/regions?q=성수
```

Response:

```json
{
  "items": [
    {
      "fullName": "서울특별시 성동구 성수동",
      "sido": "서울특별시",
      "sigungu": "성동구",
      "dong": "성수동",
      "regionCode5": "11200"
    }
  ]
}
```

### Transaction search

```http
GET /api/transactions?regionCode5=11200&sourceType=apartment&rentType=monthly&depositMax=12000&monthlyRentMax=70&page=1&pageSize=20
```

Query params:

- `regionCode5`: required, five-digit region code.
- `dong`: optional.
- `sourceType`: optional, `apartment` or `officetel`.
- `rentType`: optional, `all`, `jeonse`, or `monthly`.
- `depositMax`: optional, manwon unit.
- `monthlyRentMax`: optional, manwon unit.
- `areaMin`: optional, square meter.
- `areaMax`: optional, square meter.
- `sort`: optional, `latest`, `deposit_asc`, or `monthly_rent_asc`.
- `page`: optional, default `1`.
- `pageSize`: optional, default `20`, max `100`.

### Summary

```http
GET /api/summary?regionCode5=11200&sourceType=apartment&rentType=monthly&months=12
```

### Trends

```http
GET /api/trends?regionCode5=11200&sourceType=apartment&rentType=monthly&months=12
```

### Compare

```http
GET /api/compare?regionA=11200&regionB=11230&sourceType=officetel&rentType=monthly&months=3
```

### Filter metadata

```http
GET /api/meta/filters
```

---

## TDD Implementation Tasks

### Task 1: Scaffold project directories

**Objective:** Create the base monorepo structure without implementing business logic.

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/tests/test_health.py`
- Create: `frontend/src/App.tsx`
- Create: `.env.example`
- Create: `docker-compose.yml`

**Step 1: Create backend health test**

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_ok():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

**Step 2: Run test to verify failure**

```bash
cd backend
python -m pytest tests/test_health.py -q
```

Expected: FAIL because `app.main` does not exist yet.

**Step 3: Implement FastAPI app**

```python
from fastapi import FastAPI

app = FastAPI(title="RealRent API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}
```

**Step 4: Run test**

```bash
cd backend
python -m pytest tests/test_health.py -q
```

Expected: PASS.

---

### Task 2: Add database configuration

**Objective:** Add settings and database session setup.

**Files:**
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/tests/test_config.py`

**Step 1: Write failing config test**

```python
from app.config import Settings


def test_settings_has_database_url():
    settings = Settings(database_url="postgresql+psycopg://user:pass@localhost:5432/realrent")
    assert settings.database_url.startswith("postgresql")
```

**Step 2: Implement config**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://realrent:realrent@localhost:5432/realrent"
    public_data_service_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
```

**Step 3: Implement database session**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### Task 3: Create SQLAlchemy models

**Objective:** Create DB models for regions, transactions, summaries, and sync jobs.

**Files:**
- Create: `backend/app/models/region.py`
- Create: `backend/app/models/rental_transaction.py`
- Create: `backend/app/models/monthly_region_summary.py`
- Create: `backend/app/models/data_sync_job.py`
- Modify: `backend/app/models/__init__.py`
- Test: `backend/tests/models/test_models.py`

**Test:**

```python
from app.models.region import Region
from app.models.rental_transaction import RentalTransaction
from app.models.monthly_region_summary import MonthlyRegionSummary
from app.models.data_sync_job import DataSyncJob


def test_models_have_table_names():
    assert Region.__tablename__ == "regions"
    assert RentalTransaction.__tablename__ == "rental_transactions"
    assert MonthlyRegionSummary.__tablename__ == "monthly_region_summaries"
    assert DataSyncJob.__tablename__ == "data_sync_jobs"
```

---

### Task 4: Add Alembic migration

**Objective:** Generate initial database migration.

**Files:**
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/<timestamp>_initial_schema.py`

**Implementation note:** Alembic should import:

```python
from app.database import Base
from app.models import region, rental_transaction, monthly_region_summary, data_sync_job

target_metadata = Base.metadata
```

**Commands:**

```bash
cd backend
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

### Task 5: Implement region search service

**Objective:** Search Seoul metro region records by Korean text.

**Files:**
- Create: `backend/app/services/region_search_service.py`
- Create: `backend/app/schemas/region.py`
- Create: `backend/app/api/routes/regions.py`
- Test: `backend/tests/services/test_region_search_service.py`
- Test: `backend/tests/api/test_regions.py`

**Rules:**
- Trim query.
- Return empty list for blank query.
- Match against `full_name`, `sido_name`, `sigungu_name`, `dong_name`.
- Restrict to `is_target_region = true`.

---

### Task 6: Implement XML parser

**Objective:** Convert public data XML response into dictionaries.

**Files:**
- Create: `backend/app/ingestion/xml_parser.py`
- Test: `backend/tests/ingestion/test_xml_parser.py`

**Test:**

```python
SAMPLE_XML = """
<response>
  <body>
    <items>
      <item>
        <법정동>성수동</법정동>
        <보증금액>10,000</보증금액>
        <월세금액>65</월세금액>
      </item>
    </items>
  </body>
</response>
"""


def test_parse_items_from_xml():
    items = parse_public_data_items(SAMPLE_XML)
    assert items[0]["법정동"] == "성수동"
    assert items[0]["보증금액"] == "10,000"
```

**Implementation:** Use Python stdlib `xml.etree.ElementTree`.

---

### Task 7: Implement transaction normalizer

**Objective:** Normalize apartment/officetel raw rows into internal fields.

**Files:**
- Create: `backend/app/ingestion/normalizer.py`
- Test: `backend/tests/ingestion/test_normalizer.py`

**Rules:**
- Remove commas from money fields.
- `monthly_rent_manwon == 0` means `jeonse`.
- Parse `YYYYMM` plus day into date.
- Build deterministic `source_hash`.
- Preserve original row as `raw_payload`.

---

### Task 8: Implement transaction query API

**Objective:** Return paginated filtered transactions.

**Files:**
- Create: `backend/app/services/transaction_query_service.py`
- Create: `backend/app/schemas/transaction.py`
- Create: `backend/app/api/routes/transactions.py`
- Test: `backend/tests/api/test_transactions.py`

**Filters:**
- `regionCode5`
- `dong`
- `sourceType`
- `rentType`
- `depositMax`
- `monthlyRentMax`
- `areaMin`
- `areaMax`
- `sort`
- `page`
- `pageSize`

---

### Task 9: Implement summary API

**Objective:** Return aggregate average data for one region.

**Files:**
- Create: `backend/app/services/summary_service.py`
- Create: `backend/app/schemas/summary.py`
- Create: `backend/app/api/routes/summaries.py`
- Test: `backend/tests/api/test_summaries.py`

**Rules:**
- Default period: last 12 months.
- Return transaction count, average deposit, average monthly rent, average area, latest month, and sample warning.
- Add sample warning if transaction count is low.

---

### Task 10: Implement trends API

**Objective:** Return monthly average trend points.

**Files:**
- Create: `backend/app/services/trend_service.py`
- Create: `backend/app/schemas/trend.py`
- Create: `backend/app/api/routes/trends.py`
- Test: `backend/tests/api/test_trends.py`

**Rules:**
- Prefer `monthly_region_summaries`.
- Fallback to live aggregation from `rental_transactions` if summaries are empty.

---

### Task 11: Implement compare API

**Objective:** Compare two regions and generate a Korean insight sentence.

**Files:**
- Create: `backend/app/services/compare_service.py`
- Create: `backend/app/schemas/compare.py`
- Create: `backend/app/api/routes/compare.py`
- Test: `backend/tests/services/test_compare_service.py`
- Test: `backend/tests/api/test_compare.py`

**Text rules:**
- If B deposit and rent are lower: `B가 A보다 평균 보증금과 월세가 낮습니다.`
- If only B deposit is lower: `B가 A보다 평균 보증금이 낮습니다.`
- If only B rent is lower: `B가 A보다 평균 월세가 낮습니다.`
- If close: `두 지역의 평균 가격 수준이 비슷합니다.`

---

### Task 12: Implement aggregator

**Objective:** Build monthly summaries from transaction table.

**Files:**
- Create: `backend/app/ingestion/aggregator.py`
- Test: `backend/tests/ingestion/test_aggregator.py`

**Group by:**
- `region_code_5`
- `source_type`
- `rent_type`
- `contract_year_month`

**Calculate:**
- count
- average deposit
- average rent
- average area
- min/max deposit
- min/max rent

---

### Task 13: Implement public data fetch client

**Objective:** Fetch XML from public data API.

**Files:**
- Create: `backend/app/ingestion/molit_client.py`
- Test: `backend/tests/ingestion/test_molit_client.py`

**Test with mocked HTTP client:**
- Service key is included.
- Region code is included.
- Contract year-month is included.
- XML response is returned.

---

### Task 14: Implement frontend API client

**Objective:** Add typed API wrappers.

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/regions.ts`
- Create: `frontend/src/api/transactions.ts`
- Create: `frontend/src/api/summaries.ts`
- Create: `frontend/src/api/trends.ts`
- Create: `frontend/src/api/compare.ts`

---

### Task 15: Implement home page

**Objective:** User can search a region and apply basic filters.

**Files:**
- Create: `frontend/src/routes/HomePage.tsx`
- Create: `frontend/src/components/search/RegionSearchBox.tsx`
- Create: `frontend/src/components/filters/HousingTypeToggle.tsx`
- Create: `frontend/src/components/filters/RentTypeToggle.tsx`
- Create: `frontend/src/components/filters/BudgetFilterPanel.tsx`

**Behavior:** On submit, navigate to results route with query params.

---

### Task 16: Implement search results page

**Objective:** Display summary, trend chart, and transaction list.

**Files:**
- Create: `frontend/src/routes/SearchResultsPage.tsx`
- Create: `frontend/src/components/summary/SummaryCards.tsx`
- Create: `frontend/src/components/charts/TrendChart.tsx`
- Create: `frontend/src/components/transactions/TransactionList.tsx`
- Create: `frontend/src/components/transactions/TransactionCard.tsx`

---

### Task 17: Implement compare page

**Objective:** Compare two regions.

**Files:**
- Create: `frontend/src/routes/ComparePage.tsx`
- Create: `frontend/src/components/compare/CompareRegionPicker.tsx`
- Create: `frontend/src/components/compare/CompareSummaryCards.tsx`
- Create: `frontend/src/components/compare/CompareInsightText.tsx`

---

### Task 18: Add formatting utilities

**Objective:** Format money and area consistently.

**Files:**
- Create: `frontend/src/utils/formatMoney.ts`
- Create: `frontend/src/utils/formatArea.ts`
- Test: `frontend/src/utils/formatMoney.test.ts`

**Example expectations:**

```ts
expect(formatManwon(10000)).toBe("1억")
expect(formatManwon(12500)).toBe("1억 2,500만원")
```

---

### Task 19: Add mobile responsive styling

**Objective:** Make the MVP usable on phones.

**Files:**
- Modify: `frontend/src/styles/globals.css`

**Requirements:**
- Home search is prominent.
- Filter panel stacks vertically.
- Compare cards stack vertically.
- Transaction cards are readable on narrow screens.
- Charts do not overflow.

---

### Task 20: End-to-end smoke verification

**Objective:** Verify MVP user flow manually and with minimal automated smoke tests.

**Manual flow:**
1. Start backend.
2. Start frontend.
3. Search `성수`.
4. Select `아파트`.
5. Apply budget filter.
6. Open transaction detail.
7. Navigate to compare page.
8. Compare `성수동` vs `왕십리동`.

**Commands:**

```bash
cd backend
python -m pytest -q

cd ../frontend
npm test
npm run build
```

Expected:
- Backend tests pass.
- Frontend tests pass.
- Frontend build succeeds.

---

## MVP Done Criteria

- `GET /health` works.
- Region search returns Seoul metro regions.
- Apartment and officetel transactions can be stored in one table.
- Transaction list supports filters and pagination.
- Summary API returns averages.
- Trend API returns monthly points.
- Compare API returns region A/B, diff, and Korean insight text.
- Home page supports search and filters.
- Results page shows summary, chart, and transaction list.
- Compare page shows two-region comparison.
- Mobile layout is usable.

---

## Secret Handling

Do not commit real public data service keys or deployment tokens. Use `.env.example` placeholders only:

```env
DATABASE_URL=postgresql+psycopg://realrent:realrent@localhost:5432/realrent
PUBLIC_DATA_SERVICE_KEY=REPLACE_ME
VITE_API_BASE_URL=http://localhost:8000
```
