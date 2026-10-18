import random
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status

from config import settings
from database.db import db_manager
from models.schemas import ComplaintResponse
from routers.auth import get_current_user, require_auth, require_roles
from routers.notifications import dispatch_notification

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def generate_reference_number() -> str:
    year = datetime.utcnow().year
    rand = random.randint(1000, 9999)
    return f"CMP-{year}-{rand}"

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    toilet_id: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    reporter_email: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(get_current_user)
):
    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    photo_url = None
    if photo and photo.filename:
        ext = photo.filename.split(".")[-1].lower()
        if f".{ext}" in settings.ALLOWED_EXTENSIONS:
            filename = f"complaint_{uuid.uuid4().hex[:10]}.{ext}"
            contents = await photo.read()
            with open(settings.UPLOADS_DIR / filename, "wb") as f:
                f.write(contents)
            photo_url = f"/api/uploads/{filename}"

    now = datetime.utcnow().isoformat()
    complaint_id = f"cmp_{uuid.uuid4().hex[:10]}"
    ref_num = generate_reference_number()

    user_id = current_user.get("id") if current_user else None
    email = current_user.get("email") if current_user else (reporter_email or "anonymous@citizen.org")

    complaint_doc = {
        "id": complaint_id,
        "reference_number": ref_num,
        "toilet_id": toilet_id,
        "toilet_name": toilet.get("name"),
        "user_id": user_id,
        "reporter_email": email,
        "category": category,
        "description": description,
        "photo_url": photo_url,
        "status": "Received",
        "resolution_notes": None,
        "created_at": now,
        "updated_at": now
    }

    await db_manager.insert_one("complaints", complaint_doc)

    # Increment toilet complaints counter (does NOT change verified_status)
    current_complaints = toilet.get("total_complaints", 0) + 1
    await db_manager.update_one("toilets", {"id": toilet_id}, {"total_complaints": current_complaints})

    # Add audit log
    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "complaint_submitted",
        "entity_type": "complaint",
        "entity_id": complaint_id,
        "user_id": user_id or "guest",
        "user_email": email,
        "details": f"Complaint filed ({category}) for toilet '{toilet.get('name')}'. Ref: {ref_num}",
        "timestamp": now
    })

    # Dispatch notification to officers
    await dispatch_notification(
        title=f"Citizen Report: {category.replace('_', ' ').title()}",
        message=f"Ref {ref_num} for '{toilet.get('name')}': {description[:80]}",
        notif_type="complaint",
        target_role="officer",
        link="/municipal"
    )

    # Dispatch notification to owner
    if toilet.get("owner_id"):
        await dispatch_notification(
            title=f"Issue Reported: {toilet.get('name')}",
            message=f"Citizen reported: {description[:80]}",
            notif_type="complaint",
            user_id=toilet.get("owner_id"),
            target_role="owner",
            link="/owner"
        )

    return ComplaintResponse(
        id=complaint_id,
        reference_number=ref_num,
        toilet_id=toilet_id,
        toilet_name=toilet.get("name"),
        user_id=user_id,
        reporter_email=email,
        category=category,
        description=description,
        photo_url=photo_url,
        status="Received",
        resolution_notes=None,
        created_at=datetime.fromisoformat(now),
        updated_at=datetime.fromisoformat(now)
    )

@router.get("", response_model=List[ComplaintResponse])
async def list_complaints(
    toilet_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    my_complaints: Optional[bool] = False,
    current_user: Optional[dict] = Depends(get_current_user)
):
    query = {}
    if toilet_id:
        query["toilet_id"] = toilet_id
    if status_filter:
        query["status"] = status_filter
    if my_complaints and current_user:
        query["user_id"] = current_user["id"]

    records = await db_manager.find("complaints", query, sort=[("created_at", -1)])
    return [
        ComplaintResponse(
            id=r["id"],
            reference_number=r.get("reference_number", "CMP-0000"),
            toilet_id=r["toilet_id"],
            toilet_name=r.get("toilet_name"),
            user_id=r.get("user_id"),
            reporter_email=r.get("reporter_email"),
            category=r.get("category", "other"),
            description=r.get("description", ""),
            photo_url=r.get("photo_url"),
            status=r.get("status", "Received"),
            resolution_notes=r.get("resolution_notes"),
            created_at=datetime.fromisoformat(r["created_at"]) if isinstance(r["created_at"], str) else r["created_at"],
            updated_at=datetime.fromisoformat(r["updated_at"]) if isinstance(r["updated_at"], str) else r["updated_at"]
        )
        for r in records
    ]

@router.get("/track/{reference_number}", response_model=ComplaintResponse)
async def track_complaint(reference_number: str):
    complaint = await db_manager.find_one("complaints", {"reference_number": reference_number.strip().upper()})
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint reference number not found.")
    return ComplaintResponse(
        id=complaint["id"],
        reference_number=complaint.get("reference_number"),
        toilet_id=complaint["toilet_id"],
        toilet_name=complaint.get("toilet_name"),
        user_id=complaint.get("user_id"),
        reporter_email=complaint.get("reporter_email"),
        category=complaint.get("category"),
        description=complaint.get("description"),
        photo_url=complaint.get("photo_url"),
        status=complaint.get("status"),
        resolution_notes=complaint.get("resolution_notes"),
        created_at=datetime.fromisoformat(complaint["created_at"]) if isinstance(complaint["created_at"], str) else complaint["created_at"],
        updated_at=datetime.fromisoformat(complaint["updated_at"]) if isinstance(complaint["updated_at"], str) else complaint["updated_at"]
    )

@router.put("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: str,
    payload: dict,
    current_user: dict = Depends(require_roles(["officer"]))
):
    new_status = payload.get("status")
    resolution_notes = payload.get("resolution_notes")

    if new_status not in ["Open", "Received", "In Progress", "Under Investigation", "Action Taken", "Resolved"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid complaint status.")

    complaint = await db_manager.find_one("complaints", {"id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    now = datetime.utcnow().isoformat()
    updates = {"status": new_status, "updated_at": now}
    if resolution_notes is not None:
        updates["resolution_notes"] = resolution_notes

    await db_manager.update_one("complaints", {"id": complaint_id}, updates)
    complaint.update(updates)

    return ComplaintResponse(
        id=complaint["id"],
        reference_number=complaint.get("reference_number"),
        toilet_id=complaint["toilet_id"],
        toilet_name=complaint.get("toilet_name"),
        user_id=complaint.get("user_id"),
        reporter_email=complaint.get("reporter_email"),
        category=complaint.get("category"),
        description=complaint.get("description"),
        photo_url=complaint.get("photo_url"),
        status=complaint.get("status"),
        resolution_notes=complaint.get("resolution_notes"),
        created_at=datetime.fromisoformat(complaint["created_at"]) if isinstance(complaint["created_at"], str) else complaint["created_at"],
        updated_at=datetime.fromisoformat(complaint["updated_at"]) if isinstance(complaint["updated_at"], str) else complaint["updated_at"]
    )
