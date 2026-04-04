"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class VoteValue(int, Enum):
    YES = 1
    NO = 2
    ABSTAIN = 3


class ProposalScope(str, Enum):
    MUNICIPAL = "municipal"
    STATE = "state"
    FEDERAL = "federal"


class ProposalStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class TagCategory(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None
    municipality_code: int
    state_code: int
    country_code: str = "MX"
    biometric_data: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    did: Optional[str] = None
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    did: str
    email: Optional[str] = None
    username: Optional[str] = None
    municipality_code: int
    state_code: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfile(UserResponse):
    full_name: Optional[str] = None
    verification_date: Optional[datetime] = None
    reputation_score: float = 0.0
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ProposalCreate(BaseModel):
    title: str
    summary: str
    content: str
    category: str
    scope: ProposalScope
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None
    author: Optional[str] = None
    source_url: Optional[str] = None
    deadline: Optional[datetime] = None


class ProposalResponse(ProposalCreate):
    id: int
    status: ProposalStatus
    created_at: datetime
    updated_at: datetime
    ai_analysis: Optional[Dict[str, Any]] = None
    is_active: bool
    days_remaining: int

    class Config:
        from_attributes = True


class ProposalList(BaseModel):
    results: List[ProposalResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class VoteCreate(BaseModel):
    vote: VoteValue
    nullifier_hash: str
    vote_commitment: str
    zk_proof: Optional[Dict[str, Any]] = None


class VoteResponse(BaseModel):
    id: int
    proposal_id: int
    vote_value: VoteValue
    created_at: datetime
    municipality_code: int
    state_code: int

    class Config:
        from_attributes = True


class VoteResults(BaseModel):
    proposal_id: int
    yes_votes: int
    no_votes: int
    abstain_votes: int
    total_votes: int
    yes_percentage: float
    no_percentage: float
    abstain_percentage: float
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None


class OfficialCreate(BaseModel):
    name: str
    position: str
    level: str
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None
    party: Optional[str] = None
    biography: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class OfficialResponse(OfficialCreate):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    id: int
    name: str
    category: TagCategory
    weight: float
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RatingCreate(BaseModel):
    official_id: int
    tag_id: int


class RatingResponse(BaseModel):
    id: int
    official_id: int
    tag_id: int
    municipality_code: int
    state_code: int
    created_at: datetime
    tag: TagResponse

    class Config:
        from_attributes = True


class OfficialRatingSummary(BaseModel):
    official_id: int
    total_ratings: int
    tag_summary: Dict[str, Dict[str, Any]]


class PlatformStats(BaseModel):
    total_users: int
    total_proposals: int
    active_proposals: int
    total_votes: int
    total_officials: int
    total_ratings: int
    recent_votes_30d: int
    recent_users_30d: int
    participation_rate: float


class ZoneStats(BaseModel):
    municipality_code: Optional[int] = None
    state_code: Optional[int] = None
    users: int
    votes: int
    proposals: int
    active_proposals: int
    participation_rate: float


class AIAnalysisRequest(BaseModel):
    text: str
    analysis_type: Optional[str] = "comprehensive"


class AIAnalysisResponse(BaseModel):
    personal_impact: str
    beneficiaries: List[str]
    fairness_score: float
    recommendation: str
    confidence: float
    summary: Optional[str] = None
    benefits: Optional[List[str]] = None
    risks: Optional[List[str]] = None
