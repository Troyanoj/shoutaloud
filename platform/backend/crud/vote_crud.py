"""Vote CRUD operations."""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.vote import Vote


class VoteCRUD:
    @staticmethod
    def get_user_vote(db: Session, proposal_id: int, user_id: int) -> Optional[Vote]:
        return db.query(Vote).filter(
            Vote.proposal_id == proposal_id,
            Vote.user_id == user_id
        ).first()

    @staticmethod
    def create_vote(db: Session, vote_data: Dict[str, Any]) -> Vote:
        db_vote = Vote(**vote_data)
        db.add(db_vote)
        db.commit()
        db.refresh(db_vote)
        return db_vote

    @staticmethod
    def get_vote_results(db: Session, proposal_id: int) -> Dict[str, Any]:
        results = db.query(
            Vote.vote_value,
            func.count(Vote.id).label('count')
        ).filter(Vote.proposal_id == proposal_id).group_by(Vote.vote_value).all()

        vote_counts = {1: 0, 2: 0, 3: 0}
        for vote_value, count in results:
            vote_counts[vote_value] = count

        total_votes = sum(vote_counts.values())

        return {
            "proposal_id": proposal_id,
            "yes_votes": vote_counts[1],
            "no_votes": vote_counts[2],
            "abstain_votes": vote_counts[3],
            "total_votes": total_votes,
            "yes_percentage": (vote_counts[1] / total_votes * 100) if total_votes > 0 else 0,
            "no_percentage": (vote_counts[2] / total_votes * 100) if total_votes > 0 else 0,
            "abstain_percentage": (vote_counts[3] / total_votes * 100) if total_votes > 0 else 0,
        }

    @staticmethod
    def get_zone_vote_results(
        db: Session,
        proposal_id: int,
        municipality_code: Optional[int] = None,
        state_code: Optional[int] = None
    ) -> Dict[str, Any]:
        query = db.query(
            Vote.vote_value,
            func.count(Vote.id).label('count')
        ).filter(Vote.proposal_id == proposal_id)

        if municipality_code:
            query = query.filter(Vote.municipality_code == municipality_code)
        elif state_code:
            query = query.filter(Vote.state_code == state_code)

        results = query.group_by(Vote.vote_value).all()

        vote_counts = {1: 0, 2: 0, 3: 0}
        for vote_value, count in results:
            vote_counts[vote_value] = count

        total_votes = sum(vote_counts.values())

        return {
            "proposal_id": proposal_id,
            "municipality_code": municipality_code,
            "state_code": state_code,
            "yes_votes": vote_counts[1],
            "no_votes": vote_counts[2],
            "abstain_votes": vote_counts[3],
            "total_votes": total_votes,
            "yes_percentage": (vote_counts[1] / total_votes * 100) if total_votes > 0 else 0,
            "no_percentage": (vote_counts[2] / total_votes * 100) if total_votes > 0 else 0,
            "abstain_percentage": (vote_counts[3] / total_votes * 100) if total_votes > 0 else 0,
        }
