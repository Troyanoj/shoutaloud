"""AI analysis results model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from core.database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("scraped_documents.id"), nullable=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=True, index=True)

    analysis_type = Column(String(100), nullable=False, index=True)
    analysis_result = Column(JSON, nullable=False)

    confidence_score = Column(Float, nullable=True)
    model_version = Column(String(100), nullable=True)
    processing_time = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    proposal = relationship("Proposal", back_populates="analysis_records")
