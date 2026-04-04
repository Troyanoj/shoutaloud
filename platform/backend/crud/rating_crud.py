"""Rating CRUD operations."""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models.rating import Rating
from models.tag import Tag


class RatingCRUD:
    @staticmethod
    def get_user_rating(db: Session, official_id: int, user_id: int) -> Optional[Rating]:
        return db.query(Rating).filter(
            Rating.official_id == official_id,
            Rating.user_id == user_id
        ).first()

    @staticmethod
    def create_or_update_rating(db: Session, rating_data: Dict[str, Any]) -> Rating:
        from datetime import datetime
        existing_rating = db.query(Rating).filter(
            and_(
                Rating.official_id == rating_data['official_id'],
                Rating.user_id == rating_data['user_id']
            )
        ).first()

        if existing_rating:
            for key, value in rating_data.items():
                setattr(existing_rating, key, value)
            existing_rating.created_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_rating)
            return existing_rating
        else:
            db_rating = Rating(**rating_data)
            db.add(db_rating)
            db.commit()
            db.refresh(db_rating)
            return db_rating

    @staticmethod
    def get_official_ratings(db: Session, official_id: int) -> List[Rating]:
        return db.query(Rating).filter(Rating.official_id == official_id).all()

    @staticmethod
    def get_official_rating_summary(db: Session, official_id: int) -> Dict[str, Any]:
        ratings = db.query(Rating, Tag).join(Tag).filter(Rating.official_id == official_id).all()

        tag_counts = {}
        total_ratings = len(ratings)

        for rating, tag in ratings:
            tag_name = tag.name
            if tag_name not in tag_counts:
                tag_counts[tag_name] = {
                    'count': 0,
                    'category': tag.category,
                    'weight': tag.weight,
                    'description': tag.description
                }
            tag_counts[tag_name]['count'] += 1

        for tag_data in tag_counts.values():
            tag_data['percentage'] = (tag_data['count'] / total_ratings * 100) if total_ratings > 0 else 0

        return {
            'official_id': official_id,
            'total_ratings': total_ratings,
            'tag_summary': tag_counts
        }
