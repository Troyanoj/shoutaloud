"""Proposals router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from math import ceil

from core.database import get_db
from models.proposal import Proposal
from models.comment import Comment
from models.vote import Vote
from crud.proposal_crud import ProposalCRUD
from schemas.user import ProposalCreate, ProposalResponse, ProposalList

router = APIRouter()


@router.get("/", response_model=ProposalList)
async def list_proposals(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    scope: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    proposals = ProposalCRUD.get_proposals(
        db, skip=skip, limit=limit, scope=scope, category=category,
        status=status, municipality_code=municipality_code,
        state_code=state_code, search=search
    )
    total = ProposalCRUD.count_proposals(
        db, scope=scope, category=category, status=status,
        municipality_code=municipality_code, state_code=state_code, search=search
    )
    return ProposalList(
        results=[ProposalResponse.model_validate(p) for p in proposals],
        total=total,
        page=(skip // limit) + 1,
        per_page=limit,
        total_pages=ceil(total / limit) if total > 0 else 0
    )


@router.post("/", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(proposal: ProposalCreate, db: Session = Depends(get_db)):
    db_proposal = ProposalCRUD.create_proposal(db, proposal.model_dump())
    return ProposalResponse.model_validate(db_proposal)


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return ProposalResponse.model_validate(proposal)


@router.put("/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(proposal_id: int, proposal: ProposalCreate, db: Session = Depends(get_db)):
    db_proposal = ProposalCRUD.update_proposal(db, proposal_id, proposal.model_dump())
    if not db_proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return ProposalResponse.model_validate(db_proposal)


@router.post("/{proposal_id}/support")
async def support_proposal(proposal_id: int, db: Session = Depends(get_db)):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    proposal.support_count = (proposal.support_count or 0) + 1
    db.commit()
    return {"success": True, "support_count": proposal.support_count}


@router.get("/{proposal_id}/comments")
async def get_comments(
    proposal_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    comments = db.query(Comment).filter(
        Comment.proposal_id == proposal_id,
        Comment.is_hidden == False
    ).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": proposal.comment_count or 0,
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "author_id": c.author_id,
                "upvotes": c.upvotes,
                "downvotes": c.downvotes,
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ]
    }


@router.post("/{proposal_id}/comments", status_code=201)
async def create_comment(
    proposal_id: int,
    content: str,
    db: Session = Depends(get_db)
):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    comment = Comment(
        content=content,
        author_id=0,
        proposal_id=proposal_id,
    )
    db.add(comment)
    proposal.comment_count = (proposal.comment_count or 0) + 1
    db.commit()
    db.refresh(comment)
    return {
        "id": comment.id,
        "content": comment.content,
        "created_at": comment.created_at.isoformat(),
    }


@router.post("/{proposal_id}/documents")
async def attach_document(proposal_id: int, db: Session = Depends(get_db)):
    proposal = ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return {
        "success": True,
        "message": "IPFS document upload not yet implemented",
        "ipfs_hash": None,
    }


@router.get("/stats/overview")
async def get_proposal_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total = db.query(Proposal).count()
    by_status = dict(db.query(Proposal.status, func.count(Proposal.id)).group_by(Proposal.status).all())
    by_category = dict(db.query(Proposal.category, func.count(Proposal.id)).group_by(Proposal.category).all())
    total_votes = db.query(func.sum(Proposal.vote_count)).scalar() or 0
    return {
        "total_proposals": total,
        "by_status": by_status,
        "by_category": by_category,
        "total_votes": total_votes,
    }
