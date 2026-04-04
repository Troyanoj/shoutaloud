"""API routers package."""
from .auth import router as auth_router
from .proposals import router as proposals_router
from .voting import router as voting_router
from .officials import router as officials_router
from .ratings import router as ratings_router
from .analytics import router as analytics_router
from .ai_analysis import router as ai_router
from .moderation import router as moderation_router
from .notifications import router as notifications_router
from .reputation import router as reputation_router
from .identity import router as identity_router

__all__ = [
    "auth_router", "proposals_router", "voting_router",
    "officials_router", "ratings_router", "analytics_router", "ai_router",
    "moderation_router", "notifications_router", "reputation_router",
    "identity_router",
]
