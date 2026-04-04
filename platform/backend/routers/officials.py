"""Officials router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from crud.official_crud import OfficialCRUD
from schemas.user import OfficialCreate, OfficialResponse

router = APIRouter()


@router.get("/", response_model=list[OfficialResponse])
async def list_officials(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    level: Optional[str] = None,
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    officials = OfficialCRUD.get_officials(
        db, skip=skip, limit=limit, level=level,
        municipality_code=municipality_code, state_code=state_code
    )
    return [OfficialResponse.model_validate(o) for o in officials]


@router.post("/", response_model=OfficialResponse, status_code=201)
async def create_official(official: OfficialCreate, db: Session = Depends(get_db)):
    db_official = OfficialCRUD.create_official(db, official.model_dump())
    return OfficialResponse.model_validate(db_official)


@router.get("/{official_id}", response_model=OfficialResponse)
async def get_official(official_id: int, db: Session = Depends(get_db)):
    official = OfficialCRUD.get_official(db, official_id)
    if not official:
        raise HTTPException(status_code=404, detail="Official not found")
    return OfficialResponse.model_validate(official)
