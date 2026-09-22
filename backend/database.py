import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def create_active_engine():
    """Tries to connect to DATABASE_URL if configured. If empty, network fails, or offline, falls back to SQLite."""
    primary_url = (settings.DATABASE_URL or "").strip()
    if not primary_url:
        logger.info(
            f"No DATABASE_URL configured. Initializing local SQLite engine ({settings.SQLITE_FALLBACK_URL}) for air-gapped resilience."
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )

    try:
        # Test connecting with short explicit timeout (3s)
        logger.info("Attempting database connection to primary target...")
        connect_args = {"connect_timeout": 3} if "postgresql" in primary_url else {}
        test_engine = create_engine(
            primary_url,
            pool_pre_ping=False,
            connect_args=connect_args
        )
        with test_engine.connect() as conn:
            pass
        logger.info("Successfully connected to primary database (PostgreSQL).")
        return test_engine
    except Exception as e:
        logger.warning(
            f"Primary database unreachable or offline ({e}). "
            f"Falling back to local SQLite engine ({settings.SQLITE_FALLBACK_URL}) for air-gapped resilience."
        )
        return create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )

engine = create_active_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import backend.models  # Ensure models are loaded
    Base.metadata.create_all(bind=engine)
    _add_additive_columns()
    _backfill_audit_trail_hashes()

def _add_additive_columns():
    """Additive-only column bootstrap for tables created before a model gained
    nullable columns (no migration framework — we only ever ADD nullable
    columns with NULL defaults, never alter existing behavior)."""
    additive_columns = {
        "findings": [
            ("waived_at", "TIMESTAMP"),
            ("waived_by", "VARCHAR(100)"),
            ("waiver_justification", "TEXT"),
        ],
        # Tamper-evident audit trail chain (existing rows persist with NULL
        # hashes; every new write backfills its own + chains onto the latest).
        "audit_trail": [
            ("entry_hash", "VARCHAR(64)"),
            ("prev_hash", "VARCHAR(64)"),
        ],
    }
    dialect = engine.dialect.name
    with engine.begin() as conn:
        for table, columns in additive_columns.items():
            existing = _table_columns(conn, table)
            for col, coltype in columns:
                if col in existing:
                    continue
                if dialect == "postgresql":
                    conn.execute(text(
                        f'ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {coltype}'
                    ))
                else:
                    conn.execute(text(
                        f'ALTER TABLE {table} ADD COLUMN {col} {coltype}'
                    ))

def _table_columns(conn, table: str):
    if engine.dialect.name == "postgresql":
        rows = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :t AND table_schema = current_schema()"
        ), {"t": table}).fetchall()
        return {row[0] for row in rows}
    rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {row[1] for row in rows}

def _backfill_audit_trail_hashes():
    """Backfills audit_trail rows that were written before hash-chaining was added."""
    try:
        from backend.models.audit_trail import AuditTrailEntry
        from backend.models.audit_trail_chain import compute_entry_hash
        session = SessionLocal()
        try:
            rows = session.query(AuditTrailEntry).order_by(AuditTrailEntry.id.asc()).all()
            prev_hash = None
            mutated = False
            for i, row in enumerate(rows):
                if row.entry_hash is None or (i > 0 and row.prev_hash != prev_hash):
                    row.prev_hash = prev_hash
                    row.entry_hash = compute_entry_hash(
                        prev_hash,
                        row.action,
                        row.actor or "system",
                        row.target_type,
                        row.target_id,
                        row.details_json,
                        row.created_at,
                    )
                    mutated = True
                prev_hash = row.entry_hash
            if mutated:
                session.commit()
        except Exception as e:
            session.rollback()
            logger.warning(f"Audit trail hash backfill skipped: {e}")
        finally:
            session.close()
    except Exception as e:
        logger.warning(f"Could not load audit trail model for backfill: {e}")

