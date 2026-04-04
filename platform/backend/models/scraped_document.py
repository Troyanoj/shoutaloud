"""Scraped legal document model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Index
from core.database import Base


class ScrapedDocument(Base):
    __tablename__ = "scraped_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    url = Column(Text, unique=True, nullable=False)
    content = Column(Text, nullable=True)

    document_type = Column(String(100), nullable=True, index=True)
    source = Column(String(255), nullable=False, index=True)

    country_code = Column(String(3), default="MX", nullable=False)
    municipality_code = Column(Integer, nullable=True, index=True)
    state_code = Column(Integer, nullable=True, index=True)

    publication_date = Column(DateTime, nullable=True, index=True)
    scraped_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    processed = Column(Boolean, default=False, index=True)
    ipfs_hash = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)
