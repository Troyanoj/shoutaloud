"""Proposal model for citizen legislative proposals."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from core.database import Base


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)

    category = Column(String(100), nullable=False, index=True)
    scope = Column(String(50), nullable=False, index=True)

    municipality_code = Column(Integer, nullable=True, index=True)
    state_code = Column(Integer, nullable=True, index=True)
    country_code = Column(String(3), default="MX", nullable=False)

    status = Column(String(50), default="active", nullable=False, index=True)
    source_url = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    author_institution = Column(String(255), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    official_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    budget = Column(Float, default=0.0)
    vote_count = Column(Integer, default=0)
    support_count = Column(Integer, default=0)
    rejection_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    attachment_url = Column(String(500))
    ipfs_hash = Column(String(100))
    blockchain_tx = Column(String(100))

    deadline = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime)
    closed_at = Column(DateTime)

    ai_analysis = Column(JSON, nullable=True)
    analysis_updated_at = Column(DateTime, nullable=True)

    author = relationship("User", foreign_keys=[author_id], back_populates="proposals")
    official = relationship("User", foreign_keys=[official_id])
    votes = relationship("Vote", back_populates="proposal", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="proposal")
    tags = relationship("ProposalTag", back_populates="proposal")
    analysis_records = relationship("AIAnalysis", back_populates="proposal", cascade="all, delete-orphan")

    @property
    def is_active(self) -> bool:
        if self.status != "active":
            return False
        if self.deadline and self.deadline < datetime.utcnow():
            return False
        return True

    @property
    def days_remaining(self) -> int:
        if not self.deadline:
            return -1
        delta = self.deadline - datetime.utcnow()
        return max(0, delta.days)
