"""User CRUD operations."""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from models.user import User


class UserCRUD:
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_did(db: Session, did: str) -> Optional[User]:
        return db.query(User).filter(User.did == did).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(db: Session, user_data: Dict[str, Any]) -> User:
        if 'did' not in user_data:
            user_data['did'] = User.generate_did(user_data['email'])
        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_data: Dict[str, Any]) -> Optional[User]:
        db_user = db.query(User).filter(User.id == user_id).first()
        if db_user:
            for key, value in user_data.items():
                setattr(db_user, key, value)
            db.commit()
            db.refresh(db_user)
        return db_user

    @staticmethod
    def update_last_login(db: Session, user_id: int):
        from datetime import datetime
        db.query(User).filter(User.id == user_id).update({"last_login": datetime.utcnow()})
        db.commit()
