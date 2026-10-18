import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status

from config import settings
from database.db import db_manager
from models.schemas import TaskCreate, TaskResponse
from routers.auth import get_current_user, require_auth, require_roles

router = APIRouter(prefix="/tasks", tags=["Cleaning Tasks"])

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_cleaning_task(
    task_in: TaskCreate,
    current_user: dict = Depends(require_roles(["officer"]))
):
    toilet = await db_manager.find_one("toilets", {"id": task_in.toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    task_id = f"tsk_{uuid.uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    task_doc = {
        "id": task_id,
        "toilet_id": task_in.toilet_id,
        "toilet_name": toilet.get("name"),
        "assigned_to_owner_id": toilet.get("owner_id"),
        "assigned_to_owner_name": toilet.get("owner_name"),
        "assigned_by_id": current_user["id"],
        "assigned_by_name": current_user["full_name"],
        "status": "Pending",
        "priority": task_in.priority,
        "notes": task_in.notes or "Scheduled sanitation task",
        "completion_notes": None,
        "after_photo_url": None,
        "claimed_at": None,
        "verified_at": None,
        "created_at": now
    }

    await db_manager.insert_one("cleaning_tasks", task_doc)

    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "task_created",
        "entity_type": "task",
        "entity_id": task_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Officer assigned cleaning task for toilet '{toilet.get('name')}' to owner {toilet.get('owner_name')}.",
        "timestamp": now
    })

    return TaskResponse(
        id=task_id,
        toilet_id=task_doc["toilet_id"],
        toilet_name=task_doc["toilet_name"],
        assigned_to_owner_id=task_doc["assigned_to_owner_id"],
        assigned_to_owner_name=task_doc["assigned_to_owner_name"],
        assigned_by_id=task_doc["assigned_by_id"],
        assigned_by_name=task_doc["assigned_by_name"],
        status=task_doc["status"],
        priority=task_doc["priority"],
        notes=task_doc["notes"],
        completion_notes=None,
        after_photo_url=None,
        claimed_at=None,
        verified_at=None,
        created_at=datetime.fromisoformat(now)
    )

@router.get("", response_model=List[TaskResponse])
async def list_cleaning_tasks(
    toilet_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    owner_id: Optional[str] = None,
    current_user: dict = Depends(require_auth)
):
    query = {}
    if toilet_id:
        query["toilet_id"] = toilet_id
    if status_filter:
        query["status"] = status_filter

    user_role = current_user.get("role")
    # Owners only see tasks for their facilities
    if user_role == "owner":
        query["assigned_to_owner_id"] = current_user["id"]
    elif owner_id:
        query["assigned_to_owner_id"] = owner_id

    records = await db_manager.find("cleaning_tasks", query, sort=[("created_at", -1)])
    return [
        TaskResponse(
            id=r["id"],
            toilet_id=r["toilet_id"],
            toilet_name=r.get("toilet_name"),
            assigned_to_owner_id=r.get("assigned_to_owner_id", ""),
            assigned_to_owner_name=r.get("assigned_to_owner_name"),
            assigned_by_id=r.get("assigned_by_id", ""),
            assigned_by_name=r.get("assigned_by_name"),
            status=r.get("status", "Pending"),
            priority=r.get("priority", "Medium"),
            notes=r.get("notes"),
            completion_notes=r.get("completion_notes"),
            after_photo_url=r.get("after_photo_url"),
            claimed_at=datetime.fromisoformat(r["claimed_at"]) if r.get("claimed_at") else None,
            verified_at=datetime.fromisoformat(r["verified_at"]) if r.get("verified_at") else None,
            created_at=datetime.fromisoformat(r["created_at"]) if isinstance(r["created_at"], str) else r["created_at"]
        )
        for r in records
    ]

@router.post("/{task_id}/in-progress", response_model=TaskResponse)
async def mark_task_in_progress(
    task_id: str,
    current_user: dict = Depends(require_auth)
):
    task = await db_manager.find_one("cleaning_tasks", {"id": task_id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if current_user["role"] == "owner" and task.get("assigned_to_owner_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this task.")

    now = datetime.utcnow().isoformat()
    await db_manager.update_one("cleaning_tasks", {"id": task_id}, {"status": "In Progress"})
    task["status"] = "In Progress"

    return TaskResponse(
        id=task["id"],
        toilet_id=task["toilet_id"],
        toilet_name=task.get("toilet_name"),
        assigned_to_owner_id=task.get("assigned_to_owner_id", ""),
        assigned_to_owner_name=task.get("assigned_to_owner_name"),
        assigned_by_id=task.get("assigned_by_id", ""),
        assigned_by_name=task.get("assigned_by_name"),
        status=task["status"],
        priority=task.get("priority", "Medium"),
        notes=task.get("notes"),
        completion_notes=task.get("completion_notes"),
        after_photo_url=task.get("after_photo_url"),
        claimed_at=datetime.fromisoformat(task["claimed_at"]) if task.get("claimed_at") else None,
        verified_at=datetime.fromisoformat(task["verified_at"]) if task.get("verified_at") else None,
        created_at=datetime.fromisoformat(task["created_at"]) if isinstance(task["created_at"], str) else task["created_at"]
    )

@router.post("/{task_id}/report-completion", response_model=TaskResponse)
async def report_cleaning_completion(
    task_id: str,
    completion_notes: str = Form(...),
    after_photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(require_auth)
):
    """
    Owner reports that cleaning is completed.
    CRITICAL RULE: This does NOT automatically change the municipality verified status to Clean.
    Updates toilet status to 'Verification Pending' until an officer conducts confirmation.
    """
    task = await db_manager.find_one("cleaning_tasks", {"id": task_id})
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    if current_user["role"] == "owner" and task.get("assigned_to_owner_id") != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this task.")

    after_photo_url = None
    if after_photo and after_photo.filename:
        ext = after_photo.filename.split(".")[-1].lower()
        if f".{ext}" in settings.ALLOWED_EXTENSIONS:
            filename = f"after_clean_{uuid.uuid4().hex[:10]}.{ext}"
            contents = await after_photo.read()
            with open(settings.UPLOADS_DIR / filename, "wb") as f:
                f.write(contents)
            after_photo_url = f"/api/uploads/{filename}"

    now = datetime.utcnow().isoformat()
    updates = {
        "status": "Cleaning Reported",
        "completion_notes": completion_notes,
        "after_photo_url": after_photo_url,
        "claimed_at": now
    }
    await db_manager.update_one("cleaning_tasks", {"id": task_id}, updates)
    task.update(updates)

    # Set toilet status to Verification Pending and record last_cleaned_at
    toilet_id = task["toilet_id"]
    await db_manager.update_one(
        "toilets",
        {"id": toilet_id},
        {
            "verified_status": "Verification Pending",
            "last_cleaned_at": now,
            "updated_at": now
        }
    )

    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "cleaning_completion_reported",
        "entity_type": "task",
        "entity_id": task_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Owner reported cleaning complete with notes: '{completion_notes}'. Public status set to Verification Pending.",
        "timestamp": now
    })

    return TaskResponse(
        id=task["id"],
        toilet_id=task["toilet_id"],
        toilet_name=task.get("toilet_name"),
        assigned_to_owner_id=task.get("assigned_to_owner_id", ""),
        assigned_to_owner_name=task.get("assigned_to_owner_name"),
        assigned_by_id=task.get("assigned_by_id", ""),
        assigned_by_name=task.get("assigned_by_name"),
        status=task["status"],
        priority=task.get("priority", "Medium"),
        notes=task.get("notes"),
        completion_notes=completion_notes,
        after_photo_url=after_photo_url,
        claimed_at=datetime.fromisoformat(now),
        verified_at=None,
        created_at=datetime.fromisoformat(task["created_at"]) if isinstance(task["created_at"], str) else task["created_at"]
    )
