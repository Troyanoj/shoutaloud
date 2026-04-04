"""User model with decentralized identity support."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from sqlalchemy.orm import relationship
from core.database import Base
import hashlib
import secrets


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    did = Column(String(255), unique=True, nullable=False, index=True)
    identity_commitment = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    username = Column(String(50), unique=True, nullable=True, index=True)
    full_name = Column(String(100))

    municipality_code = Column(Integer, nullable=False, index=True)
    state_code = Column(Integer, nullable=False, index=True)
    country_code = Column(String(3), default="MX", nullable=False)

    face_hash = Column(String(255), nullable=True)
    voice_hash = Column(String(255), nullable=True)
    fingerprint_hash = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_official = Column(Boolean, default=False)
    verification_date = Column(DateTime, nullable=True)
    reputation_score = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    proposals = relationship("Proposal", foreign_keys="Proposal.author_id", back_populates="author")
    votes = relationship("Vote", back_populates="user")
    comments = relationship("Comment", back_populates="author")
    ratings = relationship("Rating", back_populates="user")

    @classmethod
    def generate_did(cls, email: str) -> str:
        timestamp = str(int(datetime.utcnow().timestamp()))
        data = f"{email}:{timestamp}:{secrets.token_hex(16)}"
        hash_value = hashlib.sha256(data.encode()).hexdigest()
        return f"did:shout:{hash_value[:32]}"
