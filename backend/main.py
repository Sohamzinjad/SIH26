from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db, engine
from backend.ai.ollama_client import ollama_client
from backend.routes import (
    audit_router,
    findings_router,
    mappings_router,
    reports_router,
    dashboard_router,
    fleet_router,
)
from backend.schemas.api import HealthResponse

app = FastAPI(
    title="SIH26155 Network Security Compliance Auditor",
    description="AI-Driven Multi-Vendor Compliance Auditor with Deterministic Rule Engine and Attack Path Correlation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    db_connected = False
    backend_type = "unknown"
    try:
        with engine.connect() as conn:
            db_connected = True
            backend_type = engine.dialect.name
    except Exception:
        pass

    ollama_ok = ollama_client.is_available()

    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        app_name=settings.APP_NAME,
        database_connected=db_connected,
        database_backend=backend_type,
        ollama_connected=ollama_ok,
        ollama_model=settings.OLLAMA_MODEL
    )

# Register routers
app.include_router(audit_router)
app.include_router(findings_router)
app.include_router(mappings_router)
app.include_router(reports_router)
app.include_router(dashboard_router)
app.include_router(fleet_router)
