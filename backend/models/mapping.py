from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON
from backend.database import Base

class AIMapping(Base):
    __tablename__ = "ai_mappings"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, nullable=True)
    fingerprint_hash = Column(String(64), index=True)
    vendor_guessed = Column(String(100), default="unknown_vendor")
    confidence = Column(Float, default=0.0)
    proposed_schema = Column(JSON)  # proposed normalized schema
    status = Column(String(30), default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    config_sample = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class MappingCache(Base):
    __tablename__ = "mapping_cache"

    id = Column(Integer, primary_key=True, index=True)
    fingerprint_hash = Column(String(64), unique=True, index=True)
    vendor_name = Column(String(100))
    mapping_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
