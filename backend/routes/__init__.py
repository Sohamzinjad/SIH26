from backend.routes.audit import router as audit_router
from backend.routes.findings import router as findings_router
from backend.routes.mappings import router as mappings_router
from backend.routes.reports import router as reports_router
from backend.routes.dashboard import router as dashboard_router

__all__ = [
    "audit_router",
    "findings_router",
    "mappings_router",
    "reports_router",
    "dashboard_router",
]
