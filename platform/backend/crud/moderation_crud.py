"""Moderation CRUD operations."""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from models.moderation import ContentReport, ModerationAction


class ModerationCRUD:
    @staticmethod
    def create_report(db: Session, report_data: Dict[str, Any]) -> ContentReport:
        db_report = ContentReport(**report_data)
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        return db_report

    @staticmethod
    def get_reports(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        content_type: Optional[str] = None,
        reason: Optional[str] = None
    ) -> List[ContentReport]:
        query = db.query(ContentReport)
        if status:
            query = query.filter(ContentReport.status == status)
        if content_type:
            query = query.filter(ContentReport.content_type == content_type)
        if reason:
            query = query.filter(ContentReport.reason == reason)
        return query.order_by(desc(ContentReport.created_at)).offset(skip).limit(limit).all()

    @staticmethod
    def count_reports(
        db: Session,
        status: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> int:
        query = db.query(ContentReport)
        if status:
            query = query.filter(ContentReport.status == status)
        if content_type:
            query = query.filter(ContentReport.content_type == content_type)
        return query.count()

    @staticmethod
    def count_pending(db: Session) -> int:
        return db.query(ContentReport).filter(ContentReport.status == "pending").count()

    @staticmethod
    def get_report(db: Session, report_id: int) -> Optional[ContentReport]:
        return db.query(ContentReport).filter(ContentReport.id == report_id).first()

    @staticmethod
    def resolve_report(
        db: Session,
        report_id: int,
        moderator_id: int,
        status: str,
        resolution: str,
        resolution_data: Optional[Dict[str, Any]] = None
    ) -> Optional[ContentReport]:
        report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
        if report:
            report.status = status
            report.moderator_id = moderator_id
            report.resolution = resolution
            report.resolution_data = resolution_data
            report.resolved_at = datetime.utcnow()
            db.commit()
            db.refresh(report)
        return report

    @staticmethod
    def create_moderation_action(db: Session, action_data: Dict[str, Any]) -> ModerationAction:
        db_action = ModerationAction(**action_data)
        db.add(db_action)
        db.commit()
        db.refresh(db_action)
        return db_action

    @staticmethod
    def get_recent_actions(db: Session, limit: int = 10) -> List[ModerationAction]:
        return db.query(ModerationAction).order_by(
            desc(ModerationAction.created_at)
        ).limit(limit).all()

    @staticmethod
    def count_total_actions(db: Session) -> int:
        return db.query(ModerationAction).count()

    @staticmethod
    def get_reports_by_reason(db: Session) -> Dict[str, int]:
        results = db.query(
            ContentReport.reason,
            func.count(ContentReport.id)
        ).group_by(ContentReport.reason).all()
        return {reason: count for reason, count in results}

    @staticmethod
    def get_reports_by_status(db: Session) -> Dict[str, int]:
        results = db.query(
            ContentReport.status,
            func.count(ContentReport.id)
        ).group_by(ContentReport.status).all()
        return {status: count for status, count in results}

    @staticmethod
    def get_dashboard(db: Session) -> Dict[str, Any]:
        total_reports = db.query(ContentReport).count()
        pending = db.query(ContentReport).filter(ContentReport.status == "pending").count()
        resolved = db.query(ContentReport).filter(
            ContentReport.status.in_(["resolved", "dismissed"])
        ).count()
        total_actions = db.query(ModerationAction).count()

        recent_reports = db.query(ContentReport).order_by(
            desc(ContentReport.created_at)
        ).limit(5).all()

        recent_actions = db.query(ModerationAction).order_by(
            desc(ModerationAction.created_at)
        ).limit(5).all()

        return {
            "total_reports": total_reports,
            "pending_reports": pending,
            "resolved_reports": resolved,
            "total_actions": total_actions,
            "recent_reports": recent_reports,
            "recent_actions": recent_actions,
            "reports_by_reason": ModerationCRUD.get_reports_by_reason(db),
            "reports_by_status": ModerationCRUD.get_reports_by_status(db),
        }
