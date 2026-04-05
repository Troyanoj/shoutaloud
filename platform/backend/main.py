"""
ShoutAloud Backend - FastAPI Main Entry Point
Refactored with modular architecture.
"""

import os
import sys
import logging
import traceback
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

# Import engine at module level for debug endpoint
from core.database import engine, get_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ==================== Configuration ====================
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")

# ==================== Application Lifecycle ====================
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    logger.info("Starting ShoutAloud Backend...")
    from core.database import init_db
    try:
        init_db()
        logger.info("Database initialized successfully")
        try:
            from seed_data import seed_data
            seed_data()
            logger.info("Seed data loaded successfully")
        except Exception as seed_err:
            logger.error(f"Seed data failed: {seed_err}")
            logger.error(traceback.format_exc())
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}. Running in demo mode.")
    yield
    logger.info("Shutting down ShoutAloud Backend...")
    from core.database import engine
    engine.dispose()

# ==================== FastAPI Application ====================
app = FastAPI(
    title="ShoutAloud API",
    description="Decentralized Citizen Governance Platform",
    version="2.0.0",
    lifespan=lifespan
)

# ==================== CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Rate Limiting ====================
from middleware.rate_limit import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware, max_requests=120, window_seconds=60)

# ==================== Caching ====================
from middleware.cache import CacheMiddleware
app.add_middleware(CacheMiddleware)

# ==================== Health Check ====================
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ShoutAloud Backend", "version": "2.0.0"}


@app.get("/health/db")
async def health_db():
    try:
        from core.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}, 503


@app.get("/health/redis")
async def health_redis():
    return {"status": "healthy", "redis": "not configured"}


@app.get("/health/ipfs")
async def health_ipfs():
    return {"status": "healthy", "ipfs": "not configured"}


@app.get("/debug/info")
async def debug_info():
    from core.database import SessionLocal, engine
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    tables = inspector.get_table_names()

    db = SessionLocal()
    try:
        user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
    except Exception:
        user_count = -1

    try:
        proposal_count = db.execute(text("SELECT COUNT(*) FROM proposals")).scalar()
    except Exception:
        proposal_count = -1

    try:
        official_count = db.execute(text("SELECT COUNT(*) FROM officials")).scalar()
    except Exception:
        official_count = -1

    db.close()

    return {
        "tables": tables,
        "user_count": user_count,
        "proposal_count": proposal_count,
        "official_count": official_count,
        "database_url": os.getenv("DATABASE_URL", "not set")[:30] + "...",
    }


@app.post("/debug/seed")
async def run_seed():
    """Manually trigger seed data population."""
    try:
        from seed_data import seed_data
        seed_data()
        return {"status": "success", "message": "Seed data loaded"}
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }


@app.post("/debug/migrate")
async def run_migration():
    """Drop and recreate all tables to match current models."""
    try:
        from core.database import Base, engine, SessionLocal
        from models import (
            user, proposal, vote, official, tag, rating,
            comment, notification, audit_log, ai_analysis,
            scraped_document, moderation,
        )

        # Drop all tables
        Base.metadata.drop_all(bind=engine)

        # Recreate all tables
        Base.metadata.create_all(bind=engine)

        # Verify
        db = SessionLocal()
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        db.close()

        return {
            "status": "success",
            "message": f"Tables recreated: {len(tables)} tables",
            "tables": tables,
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
        }

@app.get("/")
async def root():
    return {"message": "Welcome to ShoutAloud API", "version": "2.0.0", "docs": "/docs", "health": "/health"}

# ==================== Error Handlers ====================
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "status_code": exc.status_code})

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "status_code": 500})

# ==================== Routers ====================
from routers import (
    auth_router,
    proposals_router,
    voting_router,
    officials_router,
    ratings_router,
    analytics_router,
    ai_router,
    moderation_router,
    notifications_router,
    reputation_router,
    identity_router,
)

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(proposals_router, prefix="/api/proposals", tags=["Proposals"])
app.include_router(voting_router, prefix="/api/voting", tags=["Voting"])
app.include_router(officials_router, prefix="/api/officials", tags=["Officials"])
app.include_router(ratings_router, prefix="/api/ratings", tags=["Ratings"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(moderation_router, prefix="/api/moderation", tags=["Moderation"])
app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(reputation_router, prefix="/api/reputation", tags=["Reputation"])
app.include_router(identity_router, prefix="/api/identity", tags=["Identity"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
