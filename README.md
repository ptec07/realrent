# RealRent

서울·수도권 아파트/오피스텔 전월세 실거래가 검색·비교 웹 MVP입니다.

## Plan

- [MVP implementation plan](docs/plans/realrent-mvp-plan.md)

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker Compose, when using the local PostgreSQL database

## Environment

Use placeholder examples only. Do not commit real API keys or deployment tokens.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Root `.env.example` contains frontend/backend local defaults:

```env
DATABASE_URL=postgresql+psycopg://realrent:realrent@localhost:5432/realrent
PUBLIC_DATA_SERVICE_KEY=REPLACE_ME
VITE_API_BASE_URL=http://localhost:8000
```

For production, set `DATABASE_URL` to the managed PostgreSQL connection string, set `PUBLIC_DATA_SERVICE_KEY` in the backend environment, and set `VITE_API_BASE_URL` to the deployed backend URL before building the frontend.

## Local database

```bash
docker compose up -d
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e .[dev]
alembic upgrade head
python -m pytest -q
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status":"ok"}
```

## Frontend

```bash
cd frontend
npm install
npm test -- --run
npm run build
npm run dev
```

The frontend reads `VITE_API_BASE_URL` at build/dev time. For local development it defaults to `http://localhost:8000` through the example env.

## MVP verification

```bash
cd backend
python -m pytest -q

cd ../frontend
npm test -- --run
npm run build
```

## Public data ingestion

Set `DATABASE_URL` and `PUBLIC_DATA_SERVICE_KEY` before running ingestion. The CLI fetches one source type, region, and contract month, then stores normalized transactions, upserts searchable region rows, skips duplicate `source_hash` rows, and rebuilds monthly summaries for the imported month.

```bash
cd backend
python -m app.ingestion.cli \
  --source-type apartment \
  --region-code-5 11680 \
  --month 2025-01 \
  --region-sido 서울특별시 \
  --region-sigungu 강남구
```

Repeat with `--source-type officetel` when officetel data is needed.

MVP smoke coverage includes:

- region search and filter submission
- results page summary/trend/transaction rendering
- transaction detail expansion
- compare page navigation and insight rendering
- mobile responsive CSS regression

## Render backend deployment

A starter Render Blueprint is provided in [`render.yaml`](render.yaml).

Recommended settings:

- Runtime: Python
- Root directory: `backend`
- Build command: `pip install -e . && alembic upgrade head`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check path: `/health`
- Required environment variables:
  - `DATABASE_URL`
  - `PUBLIC_DATA_SERVICE_KEY`

Before troubleshooting Render, make sure the GitHub repository is not empty and contains the `backend/` directory on the deployed branch.

## Vercel frontend deployment

Deploy the `frontend/` directory as a Vite project.

Production environment variable:

```env
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

The build script copies `dist/index.html` to `dist/404.html` so browser direct navigation to SPA routes such as `/results` and `/compare` still boots the app shell on static hosting.

```bash
cd frontend
npm install
npm run build
```

## Git/deployment hygiene

Do not commit generated or local-only artifacts:

- `node_modules/`
- `dist/`
- `__pycache__/`
- `.pytest_cache/`
- `.venv/`
- `.vercel/`
- `.env` and real secret files

The root `.gitignore` is configured for these paths. If this directory is pushed as a standalone GitHub repository, initialize Git from the RealRent root and verify `git status --short` before the first push.
