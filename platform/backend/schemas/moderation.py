"""Moderation schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ContentReportCreate(BaseModel):
    content_type: str
    content_id: str
    reason: str
    description: Optional[str] = None


class ContentReportResponse(BaseModel):
    id: int
    reporter_id: int
    content_type: str
    content_id: str
    reason: str
    description: Optional[str] = None
    status: str
    moderator_id: Optional[int] = None
    resolution: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContentReportList(BaseModel):
    results: List[ContentReportResponse]
    total: int
    pending_count: int


class ResolveReportRequest(BaseModel):
    status: str
    resolution: str
    resolution_data: Optional[Dict[str, Any]] = None


class ModerationActionResponse(BaseModel):
    id: int
    moderator_id: int
    content_type: str
    content_id: str
    action_type: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ModerationDashboard(BaseModel):
    total_reports: int
    pending_reports: int
    resolved_reports: int
    total_actions: int
    recent_reports: List[ContentReportResponse]
    recent_actions: List[ModerationActionResponse]
    reports_by_reason: Dict[str, int]
    reports_by_status: Dict[str, int]
