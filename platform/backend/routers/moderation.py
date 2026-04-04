"""Moderation router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from core.database import get_db
from crud.moderation_crud import ModerationCRUD
from schemas.moderation import (
    ContentReportCreate,
    ContentReportResponse,
    ContentReportList,
    ResolveReportRequest,
    ModerationActionResponse,
    ModerationDashboard,
)

router = APIRouter()


@router.post("/reports", response_model=ContentReportResponse, status_code=201)
async def create_report(report: ContentReportCreate, db: Session = Depends(get_db)):
    report_data = report.model_dump()
    report_data["reporter_id"] = 0
    db_report = ModerationCRUD.create_report(db, report_data)
    return ContentReportResponse.model_validate(db_report)


@router.get("/reports", response_model=ContentReportList)
async def list_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    content_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    reports = ModerationCRUD.get_reports(
        db, skip=skip, limit=limit, status=status, content_type=content_type
    )
    total = ModerationCRUD.count_reports(db, status=status, content_type=content_type)
    pending = ModerationCRUD.count_pending(db)
    return ContentReportList(
        results=[ContentReportResponse.model_validate(r) for r in reports],
        total=total,
        pending_count=pending,
    )


@router.put("/reports/{report_id}/resolve", response_model=ContentReportResponse)
async def resolve_report(
    report_id: int,
    request: ResolveReportRequest,
    db: Session = Depends(get_db),
):
    report = ModerationCRUD.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    db_report = ModerationCRUD.resolve_report(
        db,
        report_id,
        moderator_id=0,
        status=request.status,
        resolution=request.resolution,
        resolution_data=request.resolution_data,
    )
    return ContentReportResponse.model_validate(db_report)


@router.get("/dashboard", response_model=ModerationDashboard)
async def get_dashboard(db: Session = Depends(get_db)):
    dashboard = ModerationCRUD.get_dashboard(db)
    return ModerationDashboard(
        total_reports=dashboard["total_reports"],
        pending_reports=dashboard["pending_reports"],
        resolved_reports=dashboard["resolved_reports"],
        total_actions=dashboard["total_actions"],
        recent_reports=[
            ContentReportResponse.model_validate(r) for r in dashboard["recent_reports"]
        ],
        recent_actions=[
            ModerationActionResponse.model_validate(a) for a in dashboard["recent_actions"]
        ],
        reports_by_reason=dashboard["reports_by_reason"],
        reports_by_status=dashboard["reports_by_status"],
    )


@router.post("/auto-check")
async def auto_check_content(text: str, db: Session = Depends(get_db)):
    spam_score = 0.0
    flags = []
    return {
        "spam_score": spam_score,
        "is_blocked": False,
        "flags": flags,
        "message": "Auto-moderation AI not yet connected",
    }
