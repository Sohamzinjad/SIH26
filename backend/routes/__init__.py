from backend.routes.audit import router as audit_router
from backend.routes.findings import router as findings_router
from backend.routes.mappings import router as mappings_router
from backend.routes.reports import router as reports_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.fleet import router as fleet_router
from backend.routes.devices import router as devices_router
from backend.routes.audit_trail import router as audit_trail_router

__all__ = [
    "audit_router",
    "findings_router",
    "mappings_router",
    "reports_router",
    "dashboard_router",
    "fleet_router",
    "devices_router",
    "audit_trail_router",
]
