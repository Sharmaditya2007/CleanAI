import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status

from config import settings
from database.db import db_manager
from ai.inference import model_service
from models.schemas import AIInferenceResult, InspectionResponse
from routers.auth import require_auth, require_roles

router = APIRouter(prefix="", tags=["AI & Inspections"])

@router.post("/ai/inspect", response_model=AIInferenceResult)
async def inspect_image_with_ai(
    image: UploadFile = File(...),
    toilet_id: Optional[str] = Form(None),
    current_user: Optional[dict] = Depends(require_auth)
):
    """
    Accepts real uploaded toilet / washroom photograph.
    Processes image with existing trained YOLO model.
    Returns real detections, bounding boxes, confidence values, and cautious recommendation.
    """
    # 1. Validate file format
    ext = Path(image.filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image extension '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Read image bytes
    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # 3. Save raw image safely outside public web root
    saved_filename = f"inspect_{uuid.uuid4().hex[:12]}{ext}"
    saved_path = settings.UPLOADS_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(contents)

    # 4. Run real inference through the model
    try:
        result = model_service.run_inference(contents)
    except Exception as e:
        # Delete file if failed
        if saved_path.exists():
            try:
                saved_path.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

    # Add raw uploaded image URL reference to result
    result_dict = result.dict()
    result_dict["raw_image_url"] = f"/api/uploads/{saved_filename}"
    result_dict["saved_filename"] = saved_filename
    
    return result

@router.post("/inspections/confirm", response_model=InspectionResponse)
async def confirm_inspection(
    payload: dict,
    current_user: dict = Depends(require_roles(["officer"]))
):
    """
    Municipal Officer confirms or overrides the AI inspection result.
    Updates verified public status only upon explicit officer confirmation.
    """
    toilet_id = payload.get("toilet_id")
    image_filename = payload.get("image_filename")
    ai_raw = payload.get("ai_raw_output", {})
    ai_recommendation = payload.get("ai_recommendation", "Inconclusive")
    officer_decision = payload.get("officer_decision")
    is_override = bool(payload.get("is_override", False))
    override_reason = payload.get("override_reason")

    if not toilet_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Toilet ID is required.")
    
    if officer_decision not in ["Clean", "Needs Cleaning", "Under Maintenance"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid officer decision required: 'Clean', 'Needs Cleaning', or 'Under Maintenance'."
        )

    if is_override and not (override_reason and override_reason.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An override reason is strictly required when overriding AI recommendation."
        )

    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    now = datetime.utcnow().isoformat()
    inspection_id = f"insp_{uuid.uuid4().hex[:10]}"

    # Save inspection record
    inspection_doc = {
        "id": inspection_id,
        "toilet_id": toilet_id,
        "toilet_name": toilet.get("name"),
        "image_url": f"/api/uploads/{image_filename}" if image_filename else "/api/uploads/default.jpg",
        "model_identifier": ai_raw.get("model_identifier", "YOLO11n-CleanAI"),
        "ai_raw_output": ai_raw,
        "ai_recommendation": ai_recommendation,
        "officer_decision": officer_decision,
        "is_override": is_override,
        "override_reason": override_reason,
        "inspector_id": current_user["id"],
        "inspector_name": current_user["full_name"],
        "inspection_status": "Confirmed",
        "created_at": now
    }
    await db_manager.insert_one("inspections", inspection_doc)

    # Authoritative update to verified public status
    await db_manager.update_one(
        "toilets",
        {"id": toilet_id},
        {
            "verified_status": officer_decision,
            "last_inspected_at": now,
            "updated_at": now
        }
    )

    # Create audit log
    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "inspection_confirmation",
        "entity_type": "inspection",
        "entity_id": inspection_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Officer confirmed inspection for toilet '{toilet.get('name')}'. Decision: {officer_decision}. Override: {is_override}",
        "timestamp": now
    })

    # If Needs Cleaning, automatically create or prompt a cleaning task
    if officer_decision == "Needs Cleaning":
        await db_manager.insert_one("cleaning_tasks", {
            "id": f"tsk_{uuid.uuid4().hex[:8]}",
            "toilet_id": toilet_id,
            "toilet_name": toilet.get("name"),
            "assigned_to_owner_id": toilet.get("owner_id"),
            "assigned_to_owner_name": toilet.get("owner_name"),
            "assigned_by_id": current_user["id"],
            "assigned_by_name": current_user["full_name"],
            "status": "Pending",
            "priority": "High",
            "notes": f"Inspection alert: Flagged as Needs Cleaning on {now[:10]}.",
            "completion_notes": None,
            "after_photo_url": None,
            "claimed_at": None,
            "verified_at": None,
            "created_at": now
        })

    return InspectionResponse(
        id=inspection_id,
        toilet_id=toilet_id,
        toilet_name=toilet.get("name"),
        image_url=inspection_doc["image_url"],
        model_identifier=inspection_doc["model_identifier"],
        ai_raw_output=inspection_doc["ai_raw_output"],
        ai_recommendation=inspection_doc["ai_recommendation"],
        officer_decision=inspection_doc["officer_decision"],
        is_override=inspection_doc["is_override"],
        override_reason=inspection_doc["override_reason"],
        inspector_id=current_user["id"],
        inspector_name=current_user["full_name"],
        inspection_status="Confirmed",
        created_at=datetime.fromisoformat(now)
    )

@router.get("/inspections", response_model=List[InspectionResponse])
async def list_inspections(
    toilet_id: Optional[str] = None,
    limit: int = 50,
    current_user: Optional[dict] = Depends(require_auth)
):
    query = {"toilet_id": toilet_id} if toilet_id else {}
    records = await db_manager.find("inspections", query, sort=[("created_at", -1)], limit=limit)
    formatted = []
    for r in records:
        formatted.append(InspectionResponse(
            id=r["id"],
            toilet_id=r["toilet_id"],
            toilet_name=r.get("toilet_name"),
            image_url=r.get("image_url", ""),
            model_identifier=r.get("model_identifier", "YOLO11n-CleanAI"),
            ai_raw_output=r.get("ai_raw_output", {}),
            ai_recommendation=r.get("ai_recommendation", ""),
            officer_decision=r.get("officer_decision", ""),
            is_override=r.get("is_override", False),
            override_reason=r.get("override_reason"),
            inspector_id=r.get("inspector_id", ""),
            inspector_name=r.get("inspector_name", "Officer"),
            inspection_status=r.get("inspection_status", "Confirmed"),
            created_at=datetime.fromisoformat(r["created_at"]) if isinstance(r["created_at"], str) else r["created_at"]
        ))
    return formatted

@router.get("/ai/sample-test", response_model=AIInferenceResult)
async def test_real_sample_inference():
    """Runs a real inference test using an actual sample image from the dataset."""
    candidate_dirs = [
        settings.CLEAN_AI_DIR / "dataset" / "yolo" / "test" / "images",
        settings.CLEAN_AI_DIR / "dataset" / "combined_v2" / "test" / "images",
        Path(settings.MODEL_PATH).resolve().parent.parent.parent.parent / "dataset" / "yolo" / "test" / "images"
    ]
    sample_files = []
    for cdir in candidate_dirs:
        if cdir.exists():
            sample_files = list(cdir.glob("*.jpg"))
            if sample_files:
                break

    if not sample_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sample dataset images found for test."
        )

    # Use first available test image
    test_image_path = sample_files[0]
    with open(test_image_path, "rb") as f:
        img_bytes = f.read()

    result = model_service.run_inference(img_bytes)
    return result
