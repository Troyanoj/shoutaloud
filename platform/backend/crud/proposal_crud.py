"""Proposal CRUD operations."""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from models.proposal import Proposal


class ProposalCRUD:
    @staticmethod
    def get_proposal(db: Session, proposal_id: int) -> Optional[Proposal]:
        return db.query(Proposal).filter(Proposal.id == proposal_id).first()

    @staticmethod
    def get_proposals(
        db: Session,
        skip: int = 0,
        limit: int = 10,
        scope: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        municipality_code: Optional[int] = None,
        state_code: Optional[int] = None,
        search: Optional[str] = None
    ) -> List[Proposal]:
        query = db.query(Proposal)
        if scope:
            query = query.filter(Proposal.scope == scope)
        if category:
            query = query.filter(Proposal.category == category)
        if status:
            query = query.filter(Proposal.status == status)
        if municipality_code:
            query = query.filter(Proposal.municipality_code == municipality_code)
        if state_code:
            query = query.filter(Proposal.state_code == state_code)
        if search:
            search_filter = or_(
                Proposal.title.ilike(f"%{search}%"),
                Proposal.summary.ilike(f"%{search}%"),
                Proposal.content.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        return query.order_by(desc(Proposal.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def count_proposals(
        db: Session,
        scope: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        municipality_code: Optional[int] = None,
        state_code: Optional[int] = None,
        search: Optional[str] = None
    ) -> int:
        query = db.query(Proposal)
        if scope:
            query = query.filter(Proposal.scope == scope)
        if category:
            query = query.filter(Proposal.category == category)
        if status:
            query = query.filter(Proposal.status == status)
        if municipality_code:
            query = query.filter(Proposal.municipality_code == municipality_code)
        if state_code:
            query = query.filter(Proposal.state_code == state_code)
        if search:
            search_filter = or_(
                Proposal.title.ilike(f"%{search}%"),
                Proposal.summary.ilike(f"%{search}%"),
                Proposal.content.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        return query.count()

    @staticmethod
    def create_proposal(db: Session, proposal_data: Dict[str, Any]) -> Proposal:
        db_proposal = Proposal(**proposal_data)
        db.add(db_proposal)
        db.commit()
        db.refresh(db_proposal)
        return db_proposal

    @staticmethod
    def update_proposal(db: Session, proposal_id: int, proposal_data: Dict[str, Any]) -> Optional[Proposal]:
        db_proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if db_proposal:
            for key, value in proposal_data.items():
                setattr(db_proposal, key, value)
            db.commit()
            db.refresh(db_proposal)
        return db_proposal

    @staticmethod
    def update_proposal_analysis(db: Session, proposal_id: int, analysis_data: Dict[str, Any]) -> Optional[Proposal]:
        from datetime import datetime
        db_proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if db_proposal:
            db_proposal.ai_analysis = analysis_data
            db_proposal.analysis_updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_proposal)
        return db_proposal
