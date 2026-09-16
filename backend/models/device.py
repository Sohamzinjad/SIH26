from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String(255), index=True, default="unknown-device")
    ip_address = Column(String(50), nullable=True)
    vendor = Column(String(100), index=True, default="cisco_ios")
    os_version = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audits = relationship("Audit", back_populates="device", cascade="all, delete-orphan")

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    filename = Column(String(255), default="running-config.cfg")
    config_text = Column(Text, nullable=False)
    score = Column(Float, default=0.0)
    pass_count = Column(Integer, default=0)
    fail_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")  # COMPLETED, PENDING_AI_MAPPING, FAILED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    device = relationship("Device", back_populates="audits")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")
    attack_paths = relationship("AttackPath", back_populates="audit", cascade="all, delete-orphan")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"), index=True)
    rule_id = Column(String(100), index=True)
    framework = Column(String(50), index=True)  # CIS, NIST-800-53, DISA-STIG
    title = Column(String(255))
    severity = Column(String(20), index=True)  # critical, high, medium, low
    weight = Column(Integer, default=10)
    status = Column(String(20), default="fail")  # pass, fail
    evidence_snippet = Column(Text, nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    remediation = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    audit = relationship("Audit", back_populates="findings")

class AttackPath(Base):
    __tablename__ = "attack_paths"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"), index=True)
    chain_id = Column(String(100), index=True)
    name = Column(String(255))
    severity = Column(String(20), default="high")
    narrative = Column(Text)
    finding_rule_ids = Column(JSON, default=list)  # list of rule_ids in this attack path
    break_rule_id = Column(String(100))
    break_why = Column(Text)
    is_active = Column(Integer, default=1)  # 1 if all prerequisite findings failed
    created_at = Column(DateTime, default=datetime.utcnow)

    audit = relationship("Audit", back_populates="attack_paths")
