from datetime import datetime, timedelta
from typing import Dict, Any, List
from collections import Counter
from fastapi import APIRouter, Depends

from database.db import db_manager
from models.schemas import MunicipalAnalytics
from routers.auth import require_auth, require_roles

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=MunicipalAnalytics)
async def get_municipal_analytics(
    current_user: dict = Depends(require_roles(["officer", "owner"]))
):
    toilets = await db_manager.find("toilets")
    inspections = await db_manager.find("inspections")
    complaints = await db_manager.find("complaints")
    tasks = await db_manager.find("cleaning_tasks")

    total_toilets = len(toilets)
    clean_toilets = sum(1 for t in toilets if t.get("verified_status") == "Clean")
    needs_cleaning = sum(1 for t in toilets if t.get("verified_status") == "Needs Cleaning")
    under_maint = sum(1 for t in toilets if t.get("verified_status") == "Under Maintenance")
    pending_approval = sum(1 for t in toilets if t.get("registration_status") == "Pending Approval")
    
    # Calculate cleanliness rate
    approved_toilets = [t for t in toilets if t.get("registration_status") == "Approved"]
    cleanliness_rate = round((clean_toilets / len(approved_toilets) * 100), 1) if approved_toilets else 0.0

    completed_inspections = len(inspections)
    pending_inspections = sum(1 for t in toilets if t.get("verified_status") in ["Needs Cleaning", "Verification Pending"])

    open_complaints = sum(1 for c in complaints if c.get("status") in ["Received", "Under Investigation"])
    resolved_complaints = sum(1 for c in complaints if c.get("status") in ["Resolved", "Action Taken"])

    active_tasks = sum(1 for t in tasks if t.get("status") in ["Pending", "In Progress", "Cleaning Reported"])
    
    # Check overdue tasks (>24 hours old and not verified)
    now = datetime.utcnow()
    overdue_tasks = 0
    for t in tasks:
        if t.get("status") in ["Pending", "In Progress"]:
            created_str = t.get("created_at")
            if created_str:
                try:
                    created_dt = datetime.fromisoformat(created_str) if isinstance(created_str, str) else created_str
                    if (now - created_dt).total_seconds() > 86400: # 24h
                        overdue_tasks += 1
                except Exception:
                    pass

    # Inspections over time (group by day for last 7 days)
    days_map = {}
    for i in range(6, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%b %d")
        days_map[day_str] = {"day": day_str, "inspections": 0, "clean": 0, "needs_cleaning": 0}

    for ins in inspections:
        created_str = ins.get("created_at")
        if created_str:
            try:
                dt = datetime.fromisoformat(created_str) if isinstance(created_str, str) else created_str
                day_key = dt.strftime("%b %d")
                if day_key in days_map:
                    days_map[day_key]["inspections"] += 1
                    if ins.get("officer_decision") == "Clean":
                        days_map[day_key]["clean"] += 1
                    else:
                        days_map[day_key]["needs_cleaning"] += 1
            except Exception:
                pass
    recent_trend = list(days_map.values())

    # Frequent issue categories from complaints
    cat_counter = Counter(c.get("category", "other") for c in complaints if c.get("category"))
    frequent_issues = [{"category": k.replace("_", " ").title(), "count": v} for k, v in cat_counter.most_common(6)]

    # Locality breakdown
    loc_counter = Counter(t.get("locality", "Central") for t in toilets)
    locality_data = [{"locality": k, "total": v} for k, v in loc_counter.most_common(5)]

    return MunicipalAnalytics(
        total_toilets=total_toilets,
        clean_toilets=clean_toilets,
        needs_cleaning_toilets=needs_cleaning,
        under_maintenance_toilets=under_maint,
        pending_approval_toilets=pending_approval,
        pending_inspections=pending_inspections,
        completed_inspections=completed_inspections,
        open_complaints=open_complaints,
        resolved_complaints=resolved_complaints,
        overdue_tasks=overdue_tasks,
        active_cleaning_tasks=active_tasks,
        cleanliness_rate=cleanliness_rate,
        recent_inspections_trend=recent_trend,
        frequent_issue_categories=frequent_issues,
        locality_breakdown=locality_data
    )
