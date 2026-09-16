from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from backend.database import Base

class AuditTrailEntry(Base):
    __tablename__ = "audit_trail"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), index=True)  # AUDIT_RUN, MAPPING_PROPOSED, MAPPING_APPROVED, MAPPING_REJECTED, REPORT_EXPORTED
    actor = Column(String(100), default="system")  # "system", "analyst_admin", etc.
    target_type = Column(String(50), nullable=True)  # audit, mapping, device
    target_id = Column(Integer, nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
