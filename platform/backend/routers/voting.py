"""Voting router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.database import get_db
from crud.vote_crud import VoteCRUD
from schemas.user import VoteCreate, VoteResponse, VoteResults

router = APIRouter()


@router.post("/{proposal_id}", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
async def cast_vote(proposal_id: int, vote: VoteCreate, db: Session = Depends(get_db)):
    existing = VoteCRUD.get_user_vote(db, proposal_id, 0)
    if existing:
        raise HTTPException(status_code=400, detail="Already voted on this proposal")

    vote_data = vote.model_dump()
    vote_data["proposal_id"] = proposal_id
    db_vote = VoteCRUD.create_vote(db, vote_data)
    return VoteResponse.model_validate(db_vote)


@router.get("/{proposal_id}/results", response_model=VoteResults)
async def get_results(proposal_id: int, db: Session = Depends(get_db)):
    return VoteResults(**VoteCRUD.get_vote_results(db, proposal_id))
