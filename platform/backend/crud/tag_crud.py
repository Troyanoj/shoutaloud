"""Tag CRUD operations."""
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.tag import Tag


class TagCRUD:
    @staticmethod
    def get_all_tags(db: Session) -> List[Tag]:
        return db.query(Tag).filter(Tag.is_active == True).order_by(Tag.category, Tag.name).all()

    @staticmethod
    def get_tags_by_category(db: Session, category: str) -> List[Tag]:
        return db.query(Tag).filter(
            and_(Tag.category == category, Tag.is_active == True)
        ).order_by(Tag.name).all()
