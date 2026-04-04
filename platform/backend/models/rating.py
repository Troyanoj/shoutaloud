"""Rating model for officials by citizens."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from core.database import Base


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    official_id = Column(Integer, ForeignKey("officials.id"), nullable=False, index=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    municipality_code = Column(Integer, nullable=False, index=True)
    state_code = Column(Integer, nullable=False, index=True)
    country_code = Column(String(3), default="MX", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    official = relationship("Official", back_populates="ratings")
    tag = relationship("Tag", back_populates="ratings")
    user = relationship("User", back_populates="ratings")

    __table_args__ = (
        UniqueConstraint('official_id', 'user_id', name='unique_rating_per_user_per_official'),
        Index('ix_ratings_official_tag', 'official_id', 'tag_id'),
    )
