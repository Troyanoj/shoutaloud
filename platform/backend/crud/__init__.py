"""CRUD operations package."""
from .user_crud import UserCRUD
from .proposal_crud import ProposalCRUD
from .vote_crud import VoteCRUD
from .official_crud import OfficialCRUD
from .rating_crud import RatingCRUD
from .tag_crud import TagCRUD
from .stats_crud import StatsCRUD

__all__ = [
    "UserCRUD", "ProposalCRUD", "VoteCRUD", "OfficialCRUD",
    "RatingCRUD", "TagCRUD", "StatsCRUD",
]
