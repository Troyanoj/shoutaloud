"""User CRUD operations."""
from typing import Optional, Dict, Any
import secrets
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
            email = user_data.get('email', f'anonymous_{secrets.token_hex(8)}@shoutaloud.local')
            user_data['did'] = User.generate_did(email)
        if 'identity_commitment' not in user_data:
            user_data['identity_commitment'] = user_data['did']
        if 'municipality_code' not in user_data:
            user_data['municipality_code'] = 0
        if 'state_code' not in user_data:
            user_data['state_code'] = 0
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
