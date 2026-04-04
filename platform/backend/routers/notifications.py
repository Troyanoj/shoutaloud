"""Notifications router."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from core.database import get_db
from crud.notification_crud import NotificationCRUD
from schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationList,
    NotificationPreferences,
)

router = APIRouter()


@router.get("/", response_model=NotificationList)
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    db: Session = Depends(get_db),
):
    user_id = 0
    notifications = NotificationCRUD.get_user_notifications(
        db, user_id=user_id, skip=skip, limit=limit, unread_only=unread_only
    )
    total = NotificationCRUD.count_user_notifications(db, user_id)
    unread = NotificationCRUD.count_unread(db, user_id)
    return NotificationList(
        results=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread,
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    user_id = 0
    notification = NotificationCRUD.mark_as_read(db, notification_id, user_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationResponse.model_validate(notification)


@router.put("/read-all")
async def mark_all_as_read(db: Session = Depends(get_db)):
    user_id = 0
    count = NotificationCRUD.mark_all_as_read(db, user_id)
    return {"success": True, "marked_count": count}


@router.get("/preferences", response_model=NotificationPreferences)
async def get_preferences(db: Session = Depends(get_db)):
    return NotificationPreferences()


@router.put("/preferences", response_model=NotificationPreferences)
async def update_preferences(prefs: NotificationPreferences, db: Session = Depends(get_db)):
    return prefs


@router.get("/achievements")
async def get_achievements(db: Session = Depends(get_db)):
    return {
        "achievements": [],
        "message": "Achievement system not yet implemented",
    }
