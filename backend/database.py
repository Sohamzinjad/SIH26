import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def create_active_engine():
    """Tries to connect to DATABASE_URL (Neon). If network fails or offline, falls back to SQLite."""
    primary_url = settings.DATABASE_URL
    try:
        # Test connecting with short timeout
        logger.info("Attempting database connection to primary target...")
        test_engine = create_engine(
            primary_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 4} if "postgresql" in primary_url else {}
        )
        with test_engine.connect() as conn:
            pass
        logger.info("Successfully connected to primary database (PostgreSQL/Neon).")
        return test_engine
    except Exception as e:
        logger.warning(
            f"Primary database unreachable or offline ({e}). "
            f"Falling back to local SQLite engine ({settings.SQLITE_FALLBACK_URL}) for air-gapped resilience."
        )
        sqlite_engine = create_engine(
            settings.SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        return sqlite_engine

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
