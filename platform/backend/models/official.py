"""Official model for government representatives."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Index
from sqlalchemy.orm import relationship
from core.database import Base


class Official(Base):
    __tablename__ = "officials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    position = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False, index=True)

    municipality_code = Column(Integer, nullable=True, index=True)
    state_code = Column(Integer, nullable=True, index=True)
    country_code = Column(String(3), default="MX", nullable=False)

    party = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    photo_url = Column(String(255), nullable=True)

    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True)
    biography = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ratings = relationship("Rating", back_populates="official", cascade="all, delete-orphan")

    @property
    def is_current(self) -> bool:
        if not self.is_active:
            return False
        now = datetime.utcnow()
        if self.start_date and self.start_date > now:
            return False
        if self.end_date and self.end_date < now:
            return False
        return True
