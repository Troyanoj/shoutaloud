"""Analytics and Statistics CRUD operations."""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from models.user import User
from models.proposal import Proposal
from models.vote import Vote
from models.official import Official
from models.rating import Rating


class StatsCRUD:
    @staticmethod
    def get_platform_stats(db: Session) -> Dict[str, Any]:
        total_users = db.query(User).filter(User.is_active == True).count()
        total_proposals = db.query(Proposal).count()
        active_proposals = db.query(Proposal).filter(Proposal.status == 'active').count()
        total_votes = db.query(Vote).count()
        total_officials = db.query(Official).filter(Official.is_active == True).count()
        total_ratings = db.query(Rating).count()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_votes = db.query(Vote).filter(Vote.created_at >= thirty_days_ago).count()
        recent_users = db.query(User).filter(User.created_at >= thirty_days_ago).count()

        return {
            'total_users': total_users,
            'total_proposals': total_proposals,
            'active_proposals': active_proposals,
            'total_votes': total_votes,
            'total_officials': total_officials,
            'total_ratings': total_ratings,
            'recent_votes_30d': recent_votes,
            'recent_users_30d': recent_users,
            'participation_rate': (total_votes / total_users * 100) if total_users > 0 else 0
        }

    @staticmethod
    def get_zone_stats(
        db: Session,
        municipality_code: Optional[int] = None,
        state_code: Optional[int] = None
    ) -> Dict[str, Any]:
        query_users = db.query(User).filter(User.is_active == True)
        query_votes = db.query(Vote)
        query_proposals = db.query(Proposal)

        if municipality_code:
            query_users = query_users.filter(User.municipality_code == municipality_code)
            query_votes = query_votes.filter(Vote.municipality_code == municipality_code)
            query_proposals = query_proposals.filter(Proposal.municipality_code == municipality_code)
        elif state_code:
            query_users = query_users.filter(User.state_code == state_code)
            query_votes = query_votes.filter(Vote.state_code == state_code)
            query_proposals = query_proposals.filter(Proposal.state_code == state_code)

        zone_users = query_users.count()
        zone_votes = query_votes.count()
        zone_proposals = query_proposals.count()
        zone_active_proposals = query_proposals.filter(Proposal.status == 'active').count()

        return {
            'municipality_code': municipality_code,
            'state_code': state_code,
            'users': zone_users,
            'votes': zone_votes,
            'proposals': zone_proposals,
            'active_proposals': zone_active_proposals,
            'participation_rate': (zone_votes / zone_users * 100) if zone_users > 0 else 0
        }
