"""Official CRUD operations."""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from models.official import Official


class OfficialCRUD:
    @staticmethod
    def get_official(db: Session, official_id: int) -> Optional[Official]:
        return db.query(Official).filter(Official.id == official_id).first()

    @staticmethod
    def get_officials(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        level: Optional[str] = None,
        municipality_code: Optional[int] = None,
        state_code: Optional[int] = None,
        is_active: bool = True
    ) -> List[Official]:
        query = db.query(Official)
        if is_active:
            query = query.filter(Official.is_active == True)
        if level:
            query = query.filter(Official.level == level)
        if municipality_code:
            query = query.filter(Official.municipality_code == municipality_code)
        if state_code:
            query = query.filter(Official.state_code == state_code)
        return query.order_by(Official.name).offset(skip).limit(limit).all()

    @staticmethod
    def create_official(db: Session, official_data: Dict[str, Any]) -> Official:
        db_official = Official(**official_data)
        db.add(db_official)
        db.commit()
        db.refresh(db_official)
        return db_official
