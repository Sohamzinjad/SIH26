import logging
from sqlalchemy import create_engine
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
