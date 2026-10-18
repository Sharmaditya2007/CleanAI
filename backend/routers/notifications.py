import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status

from database.db import db_manager
from models.schemas import NotificationResponse
from routers.auth import require_auth

router = APIRouter(prefix="/notifications", tags=["Notifications"])

async def dispatch_notification(
    title: str,
    message: str,
    notif_type: str,
    user_id: Optional[str] = None,
    target_role: Optional[str] = None,
    link: Optional[str] = None
) -> dict:
    """Helper utility to save notifications into the database."""
    now = datetime.utcnow().isoformat()
    notif_doc = {
        "id": f"ntf_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "target_role": target_role,
        "title": title,
        "message": message,
        "type": notif_type,
        "link": link,
        "is_read": False,
        "created_at": now
    }
    await db_manager.insert_one("notifications", notif_doc)
    return notif_doc

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    limit: int = 50,
    current_user: dict = Depends(require_auth)
):
    """Fetch notifications relevant to the authenticated user or role."""
    all_notifs = await db_manager.find("notifications", sort=[("created_at", -1)], limit=200)
    user_id = current_user["id"]
    user_role = current_user["role"]

    filtered = []
    for n in all_notifs:
        target_uid = n.get("user_id")
        target_role = n.get("target_role")
        if target_uid == user_id or target_role == user_role or target_role == "all":
            created_val = n["created_at"]
            if isinstance(created_val, str):
                created_dt = datetime.fromisoformat(created_val)
            else:
                created_dt = created_val
            filtered.append(NotificationResponse(
                id=n["id"],
                user_id=target_uid,
                target_role=target_role,
                title=n.get("title", "Notification"),
                message=n.get("message", ""),
                type=n.get("type", "general"),
                link=n.get("link"),
                is_read=n.get("is_read", False),
                created_at=created_dt
            ))
            if len(filtered) >= limit:
                break

    return filtered

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(require_auth)
):
    notif = await db_manager.find_one("notifications", {"id": notification_id})
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    await db_manager.update_one("notifications", {"id": notification_id}, {"is_read": True})
    return {"status": "success", "id": notification_id, "is_read": True}

@router.post("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    current_user: dict = Depends(require_auth)
):
    all_notifs = await db_manager.find("notifications")
    user_id = current_user["id"]
    user_role = current_user["role"]
    count = 0
    for n in all_notifs:
        target_uid = n.get("user_id")
        target_role = n.get("target_role")
        if (target_uid == user_id or target_role == user_role or target_role == "all") and not n.get("is_read", False):
            await db_manager.update_one("notifications", {"id": n["id"]}, {"is_read": True})
            count += 1

    return {"status": "success", "updated_count": count}
