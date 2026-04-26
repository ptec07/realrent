from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin_ingestion import router as admin_ingestion_router
from app.api.routes.compare import router as compare_router
from app.api.routes.regions import router as regions_router
from app.api.routes.summaries import router as summaries_router
from app.api.routes.transactions import router as transactions_router
from app.api.routes.trends import router as trends_router

app = FastAPI(title="RealRent API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://realrent-hazel.vercel.app", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(regions_router)
app.include_router(transactions_router)
app.include_router(summaries_router)
app.include_router(trends_router)
app.include_router(compare_router)
app.include_router(admin_ingestion_router)


@app.get("/health")
def health():
    return {"status": "ok"}
