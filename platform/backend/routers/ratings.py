"""Ratings router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from crud.rating_crud import RatingCRUD
from crud.tag_crud import TagCRUD
from schemas.user import RatingCreate, RatingResponse, OfficialRatingSummary, TagResponse

router = APIRouter()


@router.post("/", response_model=RatingResponse, status_code=201)
async def create_rating(rating: RatingCreate, db: Session = Depends(get_db)):
    rating_data = rating.model_dump()
    rating_data["municipality_code"] = 0
    rating_data["state_code"] = 0
    db_rating = RatingCRUD.create_or_update_rating(db, rating_data)
    return RatingResponse.model_validate(db_rating)


@router.get("/official/{official_id}/summary", response_model=OfficialRatingSummary)
async def get_official_rating_summary(official_id: int, db: Session = Depends(get_db)):
    return RatingCRUD.get_official_rating_summary(db, official_id)


@router.get("/tags", response_model=list[TagResponse])
async def list_tags(db: Session = Depends(get_db)):
    tags = TagCRUD.get_all_tags(db)
    return [TagResponse.model_validate(t) for t in tags]
