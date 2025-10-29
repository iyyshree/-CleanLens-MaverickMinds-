from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import os

from .schemas import ReportCreate, Report, StatusUpdate, Stats
from .store import create_memory_store
from .store_mongo import create_mongo_store


ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

app = FastAPI(title="Clean Lens Backend (FastAPI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOWED_ORIGIN == "*" else [ALLOWED_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_MONGO = bool(os.getenv("MONGODB_URI"))
store = create_mongo_store() if USE_MONGO else create_memory_store()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "clean-lens-backend-python"}


@app.get("/api/reports", response_model=list[Report])
def list_reports(status: Optional[str] = None, q: Optional[str] = None):
    return store.list_reports(status=status, q=q)


@app.get("/api/reports/stats", response_model=Stats)
def get_stats():
    return store.stats()


@app.get("/api/reports/{report_id}", response_model=Report)
def get_report(report_id: str):
    r = store.get_report(report_id)
    if r is None:
        raise HTTPException(status_code=404, detail="Not found")
    return r


@app.post("/api/reports", response_model=Report, status_code=201)
def create_report(payload: ReportCreate):
    return store.create_report(payload)


def require_admin(x_admin_api_key: Optional[str] = Header(None)):
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=501, detail="Admin API key not configured")
    if x_admin_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@app.patch("/api/reports/{report_id}/status", response_model=Report)
def update_status(report_id: str, payload: StatusUpdate, _=Depends(require_admin)):
    try:
        r = store.update_status(report_id, payload.status)
        if r is None:
            raise HTTPException(status_code=404, detail="Not found")
        return r
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/login")
def login(credentials: dict):
    email = str(credentials.get("email", "")).strip()
    password = str(credentials.get("password", "")).strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        if not ADMIN_API_KEY:
            raise HTTPException(status_code=501, detail="Admin API key not configured")
        return {"token": ADMIN_API_KEY}
    raise HTTPException(status_code=401, detail="Invalid credentials")


