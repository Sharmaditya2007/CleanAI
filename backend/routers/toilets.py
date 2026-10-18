import math
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status

from config import settings
from database.db import db_manager
from models.schemas import ToiletCreate, ToiletUpdate, ToiletResponse
from routers.auth import get_current_user, require_auth, require_roles

router = APIRouter(prefix="/toilets", tags=["Toilets"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def format_toilet_response(toilet: dict) -> dict:
    # Check staleness
    is_stale = False
    last_inspected = toilet.get("last_inspected_at")
    if last_inspected:
        try:
            dt = datetime.fromisoformat(last_inspected) if isinstance(last_inspected, str) else last_inspected
            if datetime.utcnow() - dt > timedelta(days=settings.STALE_DAYS_THRESHOLD):
                is_stale = True
        except Exception:
            is_stale = True
    else:
        is_stale = True

    resp = toilet.copy()
    resp["is_stale"] = is_stale
    return resp

@router.get("", response_model=List[ToiletResponse])
async def list_toilets(
    status: Optional[str] = Query(None, description="Clean, Needs Cleaning, Under Maintenance, Verification Pending"),
    registration_status: Optional[str] = Query(None, description="Approved, Pending Approval, Rejected, Suspended"),
    search: Optional[str] = Query(None, description="Search name, locality, address"),
    accessible: Optional[bool] = Query(None),
    facility: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    max_distance_km: Optional[float] = Query(50.0),
    owner_only: Optional[bool] = Query(False),
    current_user: Optional[dict] = Depends(get_current_user)
):
    all_toilets = await db_manager.find("toilets")
    filtered = []

    # If owner_only requested, filter by authenticated owner's id
    if owner_only:
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
        all_toilets = [t for t in all_toilets if t.get("owner_id") == current_user["id"]]

    for t in all_toilets:
        # Public users only see Approved toilets by default unless officer/owner
        user_role = current_user.get("role") if current_user else "citizen"
        if user_role not in ["officer", "owner"] and t.get("registration_status") != "Approved":
            continue

        if status and t.get("verified_status") != status:
            continue
        if registration_status and t.get("registration_status") != registration_status:
            continue
        if accessible is not None and t.get("accessibility") != accessible:
            continue
        if facility and facility not in t.get("facilities", []):
            continue

        if search:
            q = search.lower()
            text = f"{t.get('name', '')} {t.get('locality', '')} {t.get('address', '')} {t.get('city', '')}".lower()
            if q not in text:
                continue

        t_data = format_toilet_response(t)

        # Distance calculation
        if lat is not None and lon is not None:
            dist = haversine_distance(lat, lon, t.get("latitude", 0), t.get("longitude", 0))
            if dist > max_distance_km:
                continue
            t_data["distance_km"] = round(dist, 2)

        filtered.append(t_data)

    # Sort by distance if GPS provided
    if lat is not None and lon is not None:
        filtered.sort(key=lambda x: x.get("distance_km", 999999))

    return filtered

@router.get("/{toilet_id}", response_model=ToiletResponse)
async def get_toilet(toilet_id: str):
    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet facility not found.")
    return format_toilet_response(toilet)

@router.post("", response_model=ToiletResponse, status_code=status.HTTP_201_CREATED)
async def register_toilet(
    toilet_in: ToiletCreate,
    current_user: dict = Depends(require_auth)
):
    user_role = current_user.get("role", "citizen")
    now = datetime.utcnow().isoformat()
    toilet_id = f"tlt_{uuid.uuid4().hex[:8]}"

    # Officer-created toilets are automatically Approved
    is_officer = (user_role == "officer")
    reg_status = "Approved" if is_officer else "Pending Approval"
    ver_status = "Clean" if is_officer else "Verification Pending"

    new_toilet = {
        "id": toilet_id,
        "name": toilet_in.name,
        "address": toilet_in.address,
        "city": toilet_in.city,
        "locality": toilet_in.locality,
        "latitude": toilet_in.latitude,
        "longitude": toilet_in.longitude,
        "description": toilet_in.description or "",
        "facilities": toilet_in.facilities or [],
        "opening_hours": toilet_in.opening_hours or "24x7",
        "accessibility": toilet_in.accessibility,
        "access_type": toilet_in.access_type,
        "contact_number": toilet_in.contact_number,
        "owner_id": current_user["id"],
        "owner_name": current_user["full_name"],
        "registration_status": reg_status,
        "rejection_reason": None,
        "verified_status": ver_status,
        "last_inspected_at": now if is_officer else None,
        "last_cleaned_at": now if is_officer else None,
        "rating": 4.5,
        "total_complaints": 0,
        "created_at": now,
        "updated_at": now
    }

    await db_manager.insert_one("toilets", new_toilet)

    # Log audit event
    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "toilet_registration",
        "entity_type": "toilet",
        "entity_id": toilet_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Registered toilet '{toilet_in.name}' with status '{reg_status}'.",
        "timestamp": now
    })

    return format_toilet_response(new_toilet)

@router.put("/{toilet_id}", response_model=ToiletResponse)
async def update_toilet(
    toilet_id: str,
    toilet_in: ToiletUpdate,
    current_user: dict = Depends(require_auth)
):
    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    # Ownership check
    is_officer = current_user.get("role") == "officer"
    is_owner = toilet.get("owner_id") == current_user["id"]
    if not (is_officer or is_owner):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to edit this toilet.")

    update_data = {k: v for k, v in toilet_in.dict(exclude_unset=True).items() if v is not None}
    
    # Only officers can directly change verified_status without an inspection
    if "verified_status" in update_data and not is_officer:
        del update_data["verified_status"]

    if update_data:
        await db_manager.update_one("toilets", {"id": toilet_id}, update_data)
        toilet.update(update_data)

    return format_toilet_response(toilet)

@router.post("/{toilet_id}/approve", response_model=ToiletResponse)
async def approve_toilet_registration(
    toilet_id: str,
    current_user: dict = Depends(require_roles(["officer"]))
):
    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    now = datetime.utcnow().isoformat()
    updates = {
        "registration_status": "Approved",
        "rejection_reason": None,
        "updated_at": now
    }
    await db_manager.update_one("toilets", {"id": toilet_id}, updates)
    toilet.update(updates)

    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "toilet_approval",
        "entity_type": "toilet",
        "entity_id": toilet_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Officer approved registration for toilet '{toilet.get('name')}'.",
        "timestamp": now
    })

    return format_toilet_response(toilet)

@router.post("/{toilet_id}/reject", response_model=ToiletResponse)
async def reject_toilet_registration(
    toilet_id: str,
    payload: dict,
    current_user: dict = Depends(require_roles(["officer"]))
):
    reason = payload.get("reason", "").strip()
    if not reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection reason is required.")

    toilet = await db_manager.find_one("toilets", {"id": toilet_id})
    if not toilet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Toilet not found.")

    now = datetime.utcnow().isoformat()
    updates = {
        "registration_status": "Rejected",
        "rejection_reason": reason,
        "updated_at": now
    }
    await db_manager.update_one("toilets", {"id": toilet_id}, updates)
    toilet.update(updates)

    await db_manager.insert_one("audit_logs", {
        "id": f"aud_{uuid.uuid4().hex[:8]}",
        "action": "toilet_rejection",
        "entity_type": "toilet",
        "entity_id": toilet_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "details": f"Officer rejected toilet '{toilet.get('name')}'. Reason: {reason}",
        "timestamp": now
    })

    return format_toilet_response(toilet)
