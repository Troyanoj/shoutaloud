"""Analytics router."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.database import get_db
from crud.stats_crud import StatsCRUD
from schemas.user import PlatformStats, ZoneStats
from models.proposal import Proposal
from models.vote import Vote

router = APIRouter()


@router.get("/overview", response_model=PlatformStats)
async def get_platform_stats(db: Session = Depends(get_db)):
    return PlatformStats(**StatsCRUD.get_platform_stats(db))


@router.get("/zone", response_model=ZoneStats)
async def get_zone_stats(
    municipality_code: Optional[int] = Query(None),
    state_code: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return ZoneStats(**StatsCRUD.get_zone_stats(db, municipality_code, state_code))


@router.get("/proposals")
async def get_proposal_analytics(db: Session = Depends(get_db)):
    total = db.query(Proposal).count()
    by_status = dict(db.query(Proposal.status, func.count(Proposal.id)).group_by(Proposal.status).all())
    by_category = dict(db.query(Proposal.category, func.count(Proposal.id)).group_by(Proposal.category).all())
    by_scope = dict(db.query(Proposal.scope, func.count(Proposal.id)).group_by(Proposal.scope).all())
    avg_support = db.query(func.avg(Proposal.support_count)).scalar() or 0
    return {
        "total_proposals": total,
        "by_status": by_status,
        "by_category": by_category,
        "by_scope": by_scope,
        "avg_support_per_proposal": round(avg_support, 2),
    }


@router.get("/voting")
async def get_voting_analytics(db: Session = Depends(get_db)):
    total_votes = db.query(Vote).count()
    by_value = dict(db.query(Vote.vote_value, func.count(Vote.id)).group_by(Vote.vote_value).all())
    avg_weight = db.query(func.avg(Vote.weight)).scalar() or 0
    return {
        "total_votes": total_votes,
        "by_value": {str(k): v for k, v in by_value.items()},
        "avg_weight": round(avg_weight, 2),
    }
