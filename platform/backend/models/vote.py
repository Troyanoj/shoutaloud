"""Vote model with zero-knowledge privacy support."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from core.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    vote_value = Column(Integer, nullable=False)

    nullifier_hash = Column(String(255), unique=True, nullable=False, index=True)
    vote_commitment = Column(String(255), nullable=False)
    zk_proof = Column(JSON, nullable=True)

    municipality_code = Column(Integer, nullable=False, index=True)
    state_code = Column(Integer, nullable=False, index=True)
    country_code = Column(String(3), default="MX", nullable=False)

    weight = Column(Float, default=1.0)
    justification = Column(Text)
    ipfs_hash = Column(String(100))
    blockchain_tx = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_hash = Column(String(255), nullable=True)

    proposal = relationship("Proposal", back_populates="votes")
    user = relationship("User", back_populates="votes")

    __table_args__ = (
        UniqueConstraint('proposal_id', 'user_id', name='unique_vote_per_user_per_proposal'),
        Index('ix_votes_proposal_municipality', 'proposal_id', 'municipality_code'),
    )

    @property
    def vote_text(self) -> str:
        vote_map = {1: "SÍ", 2: "NO", 3: "ABSTENCIÓN"}
        return vote_map.get(self.vote_value, "UNKNOWN")
