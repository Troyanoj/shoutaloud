"""
Core database configuration and session management.
Single source of truth for database connections.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Generator

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://shoutaloud:shoutaloud_password@localhost:5432/shoutaloud"
)

USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"

if USE_SQLITE:
    SQLITE_DATABASE_URL = "sqlite:///./shout_aloud.db"
    engine = create_engine(
        SQLITE_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database session injection."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Call once on startup."""
    from models import user, proposal, vote, official, tag, rating, scraped_document, ai_analysis, audit_log, notification
    Base.metadata.create_all(bind=engine)
