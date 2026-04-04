# governance/ratings/tag_analyzer.py
"""
AI-powered tag suggestion system based on official actions
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from collections import Counter
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from .models import Official, Tag, Rating, OfficialAction
from .config import AI_SUGGESTION_CONFIG, PREDEFINED_TAGS

logger = logging.getLogger(__name__)


class TagAnalyzer:
    """
    Analyzes official actions and suggests appropriate tags
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.action_patterns = self._load_action_patterns()
    
    def _load_action_patterns(self) -> Dict[str, Dict[str, List[str]]]:
        """Load patterns that map actions to tags"""
        return {
            "vote": {
                "positive": {
                    "patterns": ["favor del pueblo", "beneficio social", "transparencia", "educación", "salud"],
                    "tags": ["ético", "responsable", "trabajador"]
                },
                "negative": {
                    "patterns": ["intereses privados", "contra el pueblo", "opacidad", "recortes sociales"],
                    "tags": ["corrupto", "opaco", "autoritario"]
                }
            },
            "proposal": {
                "positive": {
                    "patterns": ["mejora social", "innovación", "participación ciudadana", "desarrollo sustentable"],
                    "tags": ["innovador", "visionario", "cercano"]
                },
                "negative": {
                    "patterns": ["beneficio personal", "gasto excesivo", "restricción de derechos"],
                    "tags": ["corrupto", "derrochador", "autoritario"]
                }
            },
            "attendance": {
                "positive": {
                    "patterns": ["asistencia perfecta", "puntual", "presente"],
                    "tags": ["trabajador", "responsable"]
                },
                "negative": {
                    "patterns": ["ausente", "falta injustificada", "abandono"],
                    "tags": ["ausente", "negligente"]
                }
            },
            "budget": {
                "positive": {
                    "patterns": ["ahorro", "eficiencia", "optimización", "transparente"],
                    "tags": ["eficiente", "transparente", "responsable"]
                },
                "negative": {
                    "patterns": ["sobregasto", "desvío", "opaco", "injustificado"],
                    "tags": ["derrochador", "corrupto", "opaco"]
                }
            }
        }
    
    def suggest_tags(
        self,
        official_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Suggest tags for an official based on their recent actions
        
        Args:
            official_id: ID of the official
            limit: Maximum number of suggestions
            
        Returns:
            List of suggested tags with confidence scores
        """
        # Get recent actions
        recent_actions = self._get_recent_actions(official_id)
        
        if len(recent_actions) < AI_SUGGESTION_CONFIG["min_actions_for_suggestion"]:
            return self._get_default_suggestions()
        
        # Analyze actions
        tag_scores = self._analyze_actions(recent_actions)
        
        # Get already assigned tags
        assigned_tags = self._get_assigned_tags(official_id)
        
        # Filter out already assigned tags
        suggestions = []
        for tag_name, score in tag_scores.items():
            if tag_name not in assigned_tags and score >= AI_SUGGESTION_CONFIG["suggestion_confidence_threshold"]:
                tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
                if tag:
                    suggestions.append({
                        "tag": tag.to_dict(),
                        "confidence": round(score, 2),
                        "reason": self._get_suggestion_reason(tag_name, recent_actions)
                    })
        
        # Sort by confidence and limit
        suggestions.sort(key=lambda x: x["confidence"], reverse=True)
        return suggestions[:limit]
    
    def _get_recent_actions(
        self,
        official_id: int,
        days: int = 90
    ) -> List[OfficialAction]:
        """Get official's recent actions"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(OfficialAction).filter(
            and_(
                OfficialAction.official_id == official_id,
                OfficialAction.action_date >= cutoff_date
            )
        ).order_by(OfficialAction.action_date.desc()).all()
    
    def _analyze_actions(self, actions: List[OfficialAction]) -> Dict[str, float]:
        """Analyze actions and return tag scores"""
        tag_scores = Counter()
        total_weight = 0
        
        for action in actions:
            action_weight = AI_SUGGESTION_CONFIG["action_weights"].get(action.action_type, 1.0)
            patterns = self.action_patterns.get(action.action_type, {})
            
            # Check positive patterns
            for pattern in patterns.get("positive", {}).get("patterns", []):
                if pattern.lower() in action.description.lower():
                    for tag in patterns["positive"]["tags"]:
                        tag_scores[tag] += action_weight
                    total_weight += action_weight
            
            # Check negative patterns
            for pattern in patterns.get("negative", {}).get("patterns", []):
                if pattern.lower() in action.description.lower():
                    for tag in patterns["negative"]["tags"]:
                        tag_scores[tag] += action_weight
                    total_weight += action_weight
        
        # Normalize scores
        if total_weight > 0:
            return {tag: score / total_weight for tag, score in tag_scores.items()}
        return {}
    
    def _get_assigned_tags(self, official_id: int) -> List[str]:
        """Get tags already assigned to official"""
        ratings = self.db.query(Rating).join(Tag).filter(
            Rating.official_id == official_id
        ).all()
        
        return [rating.tag.name for rating in ratings]
    
    def _get_suggestion_reason(
        self,
        tag_name: str,
        actions: List[OfficialAction]
    ) -> str:
        """Generate reason for tag suggestion"""
        # Count action types that led to this suggestion
        action_counts = Counter(action.action_type for action in actions)
        main_action = action_counts.most_common(1)[0][0] if action_counts else "acciones"
        
        reasons = {
            "ético": f"Historial de {main_action} muestra decisiones éticas consistentes",
            "transparente": f"Comparte información abiertamente en sus {main_action}",
            "eficiente": f"Demuestra eficiencia en {action_counts.total()} acciones recientes",
            "corrupto": f"Patrones preocupantes detectados en {main_action}",
            "ausente": f"Múltiples ausencias registradas en sesiones importantes",
            "trabajador": f"Participación activa en {action_counts.total()} acciones",
            "innovador": f"Propuestas innovadoras en temas de {main_action}",
            "derrochador": f"Gastos excesivos identificados en presupuestos"
        }
        
        return reasons.get(tag_name, f"Basado en análisis de {len(actions)} acciones recientes")
    
    def _get_default_suggestions(self) -> List[Dict[str, Any]]:
        """Get default suggestions for new officials"""
        default_tags = ["nuevo", "cauteloso", "reservado"]
        suggestions = []
        
        for tag_name in default_tags:
            tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
            if tag:
                suggestions.append({
                    "tag": tag.to_dict(),
                    "confidence": 0.5,
                    "reason": "Sugerencia inicial para funcionario nuevo"
                })
        
        return suggestions
    
    def analyze_voting_patterns(
        self,
        official_id: int
    ) -> Dict[str, Any]:
        """
        Analyze official's voting patterns
        
        Returns:
            Analysis of voting behavior
        """
        vote_actions = self.db.query(OfficialAction).filter(
            and_(
                OfficialAction.official_id == official_id,
                OfficialAction.action_type == "vote"
            )
        ).all()
        
        if not vote_actions:
            return {"status": "no_votes", "analysis": {}}
        
        # Analyze vote alignment
        vote_analysis = {
            "total_votes": len(vote_actions),
            "citizen_aligned": 0,
            "party_aligned": 0,
            "controversial": 0,
            "abstentions": 0
        }
        
        for vote in vote_actions:
            metadata = vote.metadata or {}
            
            if metadata.get("citizen_support", 0) > 60:
                vote_analysis["citizen_aligned"] += 1
            
            if metadata.get("party_line_vote", False):
                vote_analysis["party_aligned"] += 1
            
            if metadata.get("controversial", False):
                vote_analysis["controversial"] += 1
            
            if metadata.get("vote_type") == "abstention":
                vote_analysis["abstentions"] += 1
        
        # Calculate percentages
        total = vote_analysis["total_votes"]
        vote_analysis["citizen_alignment_rate"] = round(
            (vote_analysis["citizen_aligned"] / total) * 100, 1
        )
        vote_analysis["party_alignment_rate"] = round(
            (vote_analysis["party_aligned"] / total) * 100, 1
        )
        
        return {
            "status": "analyzed",
            "analysis": vote_analysis,
            "suggested_tags": self._suggest_tags_from_votes(vote_analysis)
        }
    
    def _suggest_tags_from_votes(self, vote_analysis: Dict[str, Any]) -> List[str]:
        """Suggest tags based on voting patterns"""
        suggestions = []
        
        if vote_analysis["citizen_alignment_rate"] > 80:
            suggestions.append("cercano")
        elif vote_analysis["citizen_alignment_rate"] < 30:
            suggestions.append("autoritario")
        
        if vote_analysis["party_alignment_rate"] > 90:
            suggestions.append("político")
        
        if vote_analysis["abstentions"] / vote_analysis["total_votes"] > 0.2:
            suggestions.append("cauteloso")
        
        return suggestions


# governance/ratings/reputation_calculator.py
"""
Reputation score calculation system
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import numpy as np

from .models import Official, Tag, Rating, ReputationScore
from .config import SCORE_WEIGHTS, REPUTATION_CONFIG

logger = logging.getLogger(__name__)


class ReputationCalculator:
    """
    Calculates and updates reputation scores for officials
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def calculate_reputation(
        self,
        official_id: int,
        zone_type: str,
        zone_code: int
    ) -> ReputationScore:
        """
        Calculate reputation score for an official in a specific zone
        
        Args:
            official_id: ID of the official
            zone_type: Type of zone (municipal, state, federal)
            zone_code: Code of the zone
            
        Returns:
            Updated reputation score
        """
        # Get or create reputation score
        reputation = self.db.query(ReputationScore).filter(
            and_(
                ReputationScore.official_id == official_id,
                ReputationScore.zone_type == zone_type,
                ReputationScore.zone_code == zone_code
            )
        ).first()
        
        if not reputation:
            reputation = ReputationScore(
                official_id=official_id,
                zone_type=zone_type,
                zone_code=zone_code
            )
            self.db.add(reputation)
        
        # Get all ratings for this official in this zone
        ratings = self._get_zone_ratings(official_id, zone_type, zone_code)
        
        if not ratings:
            # No ratings yet, keep default scores
            self.db.commit()
            return reputation
        
        # Calculate tag statistics
        tag_stats = self._calculate_tag_stats(ratings)
        
        # Update basic counts
        reputation.positive_tags = tag_stats["positive"]
        reputation.negative_tags = tag_stats["negative"]
        reputation.neutral_tags = tag_stats["neutral"]
        reputation.total_ratings = len(ratings)
        reputation.unique_raters = len(set(r.citizen_hash for r in ratings))
        
        # Calculate component scores
        scores = self._calculate_component_scores(ratings)
        reputation.ethics_score = scores["ethics"]
        reputation.efficiency_score = scores["efficiency"]
        reputation.transparency_score = scores["transparency"]
        reputation.community_score = scores["community"]
        
        # Calculate overall score
        reputation.overall_score = self._calculate_overall_score(scores)
        
        # Calculate trend
        reputation.score_trend = self._calculate_trend(official_id, zone_type, zone_code)
        
        # Update timestamp
        reputation.last_updated = datetime.utcnow()
        
        self.db.commit()
        return reputation
    
    def _get_zone_ratings(
        self,
        official_id: int,
        zone_type: str,
        zone_code: int
    ) -> List[Rating]:
        """Get ratings from citizens in specific zone"""
        # For municipal zone, get ratings from that municipality
        # For state zone, get ratings from all municipalities in that state
        # For federal zone, get all ratings
        
        query = self.db.query(Rating).filter(Rating.official_id == official_id)
        
        # In production, filter by citizen location
        # For now, return all ratings
        return query.all()
    
    def _calculate_tag_stats(self, ratings: List[Rating]) -> Dict[str, int]:
        """Calculate tag category statistics"""
        stats = {"positive": 0, "negative": 0, "neutral": 0}
        
        for rating in ratings:
            if rating.tag.category in stats:
                stats[rating.tag.category] += 1
        
        return stats
    
    def _calculate_component_scores(self, ratings: List[Rating]) -> Dict[str, float]:
        """Calculate individual component scores"""
        scores = {
            "ethics": 50.0,
            "efficiency": 50.0,
            "transparency": 50.0,
            "community": 50.0
        }
        
        # Group ratings by tag name
        tag_counts = {}
        for rating in ratings:
            tag_name = rating.tag.name
            tag_counts[tag_name] = tag_counts.get(tag_name, 0) + 1
        
        # Calculate each component score
        for component, config in SCORE_WEIGHTS.items():
            relevant_tags = config["tags"]
            positive_count = 0
            negative_count = 0
            total_count = 0
            
            for tag_name in relevant_tags:
                if tag_name in tag_counts:
                    count = tag_counts[tag_name]
                    total_count += count
                    
                    # Get tag category
                    tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
                    if tag:
                        if tag.category == "positive":
                            positive_count += count * tag.weight
                        elif tag.category == "negative":
                            negative_count += count * tag.weight
            
            # Calculate component score
            if total_count > 0:
                # Score formula: 50 + (positive - negative) / total * 50
                # This gives a range of 0-100 with 50 as neutral
                score_adjustment = ((positive_count - negative_count) / total_count) * 50
                scores[component] = max(0, min(100, 50 + score_adjustment))
        
        return scores
    
    def _calculate_overall_score(self, component_scores: Dict[str, float]) -> float:
        """Calculate weighted overall score"""
        overall = 0.0
        
        for component, score in component_scores.items():
            weight = SCORE_WEIGHTS.get(component, {}).get("weight", 0.25)
            overall += score * weight
        
        return round(overall, 1)
    
    def _calculate_trend(
        self,
        official_id: int,
        zone_type: str,
        zone_code: int,
        days: int = 30
    ) -> float:
        """Calculate score trend over time period"""
        # Get ratings from last period
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        recent_ratings = self.db.query(Rating).filter(
            and_(
                Rating.official_id == official_id,
                Rating.timestamp >= cutoff_date
            )
        ).all()
        
        if not recent_ratings:
            return 0.0
        
        # Calculate score for recent period
        recent_scores = self._calculate_component_scores(recent_ratings)
        recent_overall = self._calculate_overall_score(recent_scores)
        
        # Get current score
        current_reputation = self.db.query(ReputationScore).filter(
            and_(
                ReputationScore.official_id == official_id,
                ReputationScore.zone_type == zone_type,
                ReputationScore.zone_code == zone_code
            )
        ).first()
        
        if current_reputation:
            trend = recent_overall - current_reputation.overall_score
            return round(trend, 1)
        
        return 0.0
    
    def get_zone_rankings(
        self,
        zone_type: str,
        zone_code: int,
        limit: int = 10,
        order: str = "desc"
    ) -> List[Dict]:
        """
        Get official rankings for a specific zone
        
        Args:
            zone_type: Type of zone
            zone_code: Zone code
            limit: Number of results
            order: Sort order (desc/asc)
            
        Returns:
            List of officials with reputation scores
        """
        query = self.db.query(ReputationScore, Official).join(
            Official,
            ReputationScore.official_id == Official.id
        ).filter(
            and_(
                ReputationScore.zone_type == zone_type,
                ReputationScore.zone_code == zone_code,
                Official.active == True
            )
        )
        
        if order == "desc":
            query = query.order_by(ReputationScore.overall_score.desc())
        else:
            query = query.order_by(ReputationScore.overall_score.asc())
        
        results = query.limit(limit).all()
        
        rankings = []
        for idx, (reputation, official) in enumerate(results, 1):
            rankings.append({
                "rank": idx,
                "official": official.to_dict(),
                "reputation": reputation.to_dict(),
                "score_label": self._get_score_label(reputation.overall_score),
                "trend_indicator": self._get_trend_indicator(reputation.score_trend)
            })
        
        return rankings
    
    def _get_score_label(self, score: float) -> Dict[str, str]:
        """Get label and color for score"""
        for range_name, config in REPUTATION_CONFIG["score_ranges"].items():
            if score >= config["min"]:
                return {
                    "label": config["label"],
                    "color": config["color"]
                }
        
        return {
            "label": "Sin calificación",
            "color": "#6B7280"
        }
    
    def _get_trend_indicator(self, trend: float) -> Dict[str, str]:
        """Get trend indicator"""
        for indicator_name, config in REPUTATION_CONFIG["trend_indicators"].items():
            if trend >= config["min"]:
                return {
                    "icon": config["icon"],
                    "color": config["color"],
                    "label": indicator_name
                }
        
        return {
            "icon": "➡️",
            "color": "#6B7280",
            "label": "stable"
        }
    
    def calculate_community_comparison(
        self,
        official_id: int
    ) -> Dict[str, Any]:
        """
        Compare official's reputation across different communities
        
        Args:
            official_id: ID of the official
            
        Returns:
            Comparison data across zones
        """
        # Get all reputation scores for this official
        reputations = self.db.query(ReputationScore).filter(
            ReputationScore.official_id == official_id
        ).all()
        
        if not reputations:
            return {"status": "no_data", "comparisons": []}
        
        comparisons = []
        for reputation in reputations:
            comparisons.append({
                "zone_type": reputation.zone_type,
                "zone_code": reputation.zone_code,
                "overall_score": reputation.overall_score,
                "total_ratings": reputation.total_ratings,
                "unique_raters": reputation.unique_raters,
                "score_label": self._get_score_label(reputation.overall_score),
                "components": {
                    "ethics": reputation.ethics_score,
                    "efficiency": reputation.efficiency_score,
                    "transparency": reputation.transparency_score,
                    "community": reputation.community_score
                }
            })
        
        # Sort by overall score
        comparisons.sort(key=lambda x: x["overall_score"], reverse=True)
        
        # Calculate variance
        scores = [c["overall_score"] for c in comparisons]
        variance = np.var(scores) if len(scores) > 1 else 0
        
        return {
            "status": "success",
            "comparisons": comparisons,
            "statistics": {
                "average_score": round(np.mean(scores), 1),
                "highest_score": max(scores),
                "lowest_score": min(scores),
                "variance": round(variance, 2),
                "consistency": "consistent" if variance < 100 else "varied"
            }
        }
    
    def get_top_tags(
        self,
        official_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get most assigned tags for an official
        
        Args:
            official_id: ID of the official
            limit: Maximum number of tags
            
        Returns:
            List of top tags with counts
        """
        # Query to get tag counts
        tag_counts = self.db.query(
            Tag,
            func.count(Rating.id).label('count')
        ).join(
            Rating,
            Tag.id == Rating.tag_id
        ).filter(
            Rating.official_id == official_id
        ).group_by(
            Tag.id
        ).order_by(
            func.count(Rating.id).desc()
        ).limit(limit).all()
        
        top_tags = []
        for tag, count in tag_counts:
            top_tags.append({
                "tag": tag.to_dict(),
                "count": count,
                "percentage": 0  # Will calculate below
            })
        
        # Calculate percentages
        total_ratings = sum(item["count"] for item in top_tags)
        if total_ratings > 0:
            for item in top_tags:
                item["percentage"] = round((item["count"] / total_ratings) * 100, 1)
        
        return top_tags
    
    def update_all_reputations(self):
        """Update reputation scores for all active officials"""
        # Get all active officials
        officials = self.db.query(Official).filter(
            Official.active == True
        ).all()
        
        updated_count = 0
        for official in officials:
            try:
                # Update municipal reputation
                self.calculate_reputation(
                    official.id,
                    "municipal",
                    official.municipality_code
                )
                
                # Update state reputation
                self.calculate_reputation(
                    official.id,
                    "state",
                    official.state_code
                )
                
                # Update federal reputation
                self.calculate_reputation(
                    official.id,
                    "federal",
                    0  # Country level
                )
                
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Error updating reputation for official {official.id}: {str(e)}")
        
        logger.info(f"Updated reputation scores for {updated_count} officials")
        return updated_count