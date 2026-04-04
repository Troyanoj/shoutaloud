"""Notification schemas."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationList(BaseModel):
    results: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    proposal_updates: bool = True
    voting_reminders: bool = True
    moderation_alerts: bool = False
    reputation_changes: bool = True
    weekly_digest: bool = True
