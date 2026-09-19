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
    entry_hash = Column(String(64), nullable=False, default=None)
    prev_hash = Column(String(64), nullable=True, default=None)
    # Tamper-evident chain linkage (additive; existing rows persist via the
    # additive bootstrap in backend/database.py, hashes backfilled on next write).
    # entry_hash = SHA-256 over the canonical serialization of this row's fields
    # chained onto prev_hash (see backend/models/audit_trail_chain.py for the
    # byte-for-byte canonicalization contract).
    entry_hash = Column(String(64), nullable=False, default=None)
    prev_hash = Column(String(64), nullable=True, default=None)  # None ONLY for the very first row
