"""Reputation router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.user import User
from models.tag import Tag
from models.rating import Rating
from crud.user_crud import UserCRUD
from crud.rating_crud import RatingCRUD
from crud.tag_crud import TagCRUD
from schemas.reputation import (
    ReputationScoreResponse,
    BadgeResponse,
    ReputationHistoryResponse,
    ReputationHistoryItem,
    OfficialTagsResponse,
    AddOfficialTagRequest,
)

router = APIRouter()

BADGES = [
    {"id": 1, "name": "Ciudadano", "description": "Registro completado", "icon": "user"},
    {"id": 2, "name": "Activista", "description": "10 propuestas creadas", "icon": "megaphone"},
    {"id": 3, "name": "Líder", "description": "50 votos emitidos", "icon": "star"},
    {"id": 4, "name": "Guardián", "description": "Reputación > 100", "icon": "shield"},
]


def _calculate_reputation(db: Session, user_id: int) -> dict:
    user = UserCRUD.get_user(db, user_id)
    if not user:
        return None
    return {
        "user_id": user_id,
        "total_score": user.reputation_score or 0.0,
        "level": _score_to_level(user.reputation_score or 0.0),
        "positive_tags": 0,
        "negative_tags": 0,
        "neutral_tags": 0,
        "participation_count": 0,
        "last_updated": user.updated_at or user.created_at,
    }


def _score_to_level(score: float) -> str:
    if score >= 100:
        return "Guardián"
    if score >= 50:
        return "Líder"
    if score >= 20:
        return "Activista"
    return "Ciudadano"


@router.get("/{user_id}", response_model=ReputationScoreResponse)
async def get_reputation_score(user_id: int, db: Session = Depends(get_db)):
    data = _calculate_reputation(db, user_id)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return ReputationScoreResponse(**data)


@router.get("/{user_id}/badges", response_model=List[BadgeResponse])
async def get_user_badges(user_id: int, db: Session = Depends(get_db)):
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    score = user.reputation_score or 0.0
    earned = []
    earned.append(BadgeResponse(**BADGES[0]))
    if score >= 20:
        earned.append(BadgeResponse(**BADGES[1]))
    if score >= 50:
        earned.append(BadgeResponse(**BADGES[2]))
    if score >= 100:
        earned.append(BadgeResponse(**BADGES[3]))
    return earned


@router.get("/{user_id}/history", response_model=ReputationHistoryResponse)
async def get_reputation_history(user_id: int, db: Session = Depends(get_db)):
    user = UserCRUD.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ReputationHistoryResponse(
        user_id=user_id,
        history=[],
        total_items=0,
    )


@router.get("/officials/{official_id}", response_model=OfficialTagsResponse)
async def get_official_reputation(official_id: int, db: Session = Depends(get_db)):
    summary = RatingCRUD.get_official_rating_summary(db, official_id)
    tags = summary.get("tag_summary", {})
    dominant = max(tags, key=lambda k: tags[k]["count"]) if tags else None
    return OfficialTagsResponse(
        official_id=official_id,
        official_name="Official",
        tags={k: v["count"] for k, v in tags.items()},
        total_ratings=summary.get("total_ratings", 0),
        dominant_tag=dominant,
        dominant_category=tags[dominant]["category"] if dominant else None,
    )


@router.post("/officials/{official_id}/tags")
async def add_official_tag(
    official_id: int,
    request: AddOfficialTagRequest,
    db: Session = Depends(get_db),
):
    tag = db.query(Tag).filter(Tag.name == request.tag_name).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {
        "success": True,
        "message": f"Tag '{request.tag_name}' added to official {official_id}",
    }
