"""Reputation schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ReputationScoreResponse(BaseModel):
    user_id: int
    total_score: float
    level: str
    positive_tags: int
    negative_tags: int
    neutral_tags: int
    participation_count: int
    last_updated: datetime


class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReputationHistoryItem(BaseModel):
    action_type: str
    score_change: float
    description: str
    created_at: datetime


class ReputationHistoryResponse(BaseModel):
    user_id: int
    history: List[ReputationHistoryItem]
    total_items: int


class OfficialTagsResponse(BaseModel):
    official_id: int
    official_name: str
    tags: Dict[str, int]
    total_ratings: int
    dominant_tag: Optional[str] = None
    dominant_category: Optional[str] = None


class AddOfficialTagRequest(BaseModel):
    tag_name: str
    reason: Optional[str] = None
