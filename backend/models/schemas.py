from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# Auth & User Schemas
class UserRole:
    OFFICER = "officer"
    OWNER = "owner"
    CITIZEN = "citizen"

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = Field(default=UserRole.CITIZEN)
    phone: Optional[str] = None
    organization: Optional[str] = None

class UserCreate(UserBase):
    password: str
    invite_code: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserResponse(UserBase):
    id: str
    is_active: bool = True
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Bounding Box and Detection Schemas
class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float

class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: BoundingBox
    is_dirty_indicator: bool

class AIInferenceResult(BaseModel):
    success: bool
    model_identifier: str
    framework: str = "Ultralytics YOLO"
    total_detections: int
    detections: List[Detection]
    clean_indicators_detected: List[str]
    dirty_indicators_detected: List[str]
    ai_recommendation: str  # "Clean", "Needs Cleaning", "Under Maintenance", "Inconclusive - Officer Inspection Required"
    confidence_summary: Dict[str, float]
    message: str
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    annotated_image_url: Optional[str] = None

# Toilet Schemas
class ToiletFacility(BaseModel):
    name: str
    available: bool = True

class ToiletBase(BaseModel):
    name: str
    address: str
    city: str
    locality: str
    latitude: float
    longitude: float
    description: Optional[str] = ""
    facilities: List[str] = Field(default_factory=list)
    opening_hours: Optional[str] = "24x7"
    accessibility: bool = True
    access_type: str = "public"  # "public", "private", "paid"
    contact_number: Optional[str] = None

class ToiletCreate(ToiletBase):
    pass

class ToiletUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    facilities: Optional[List[str]] = None
    opening_hours: Optional[str] = None
    accessibility: Optional[bool] = None
    access_type: Optional[str] = None
    contact_number: Optional[str] = None
    verified_status: Optional[str] = None

class ToiletResponse(ToiletBase):
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    registration_status: str  # "Pending Approval", "Approved", "Rejected", "Suspended"
    rejection_reason: Optional[str] = None
    verified_status: str      # "Clean", "Needs Cleaning", "Under Maintenance", "Verification Pending"
    last_inspected_at: Optional[datetime] = None
    last_cleaned_at: Optional[datetime] = None
    is_stale: bool = False
    rating: float = 4.2
    total_complaints: int = 0
    distance_km: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

# Inspection Schemas
class InspectionCreate(BaseModel):
    toilet_id: str
    officer_decision: str  # "Clean", "Needs Cleaning", "Under Maintenance"
    is_override: bool = False
    override_reason: Optional[str] = None
    notes: Optional[str] = None

class InspectionResponse(BaseModel):
    id: str
    toilet_id: str
    toilet_name: Optional[str] = None
    image_url: str
    model_identifier: str
    ai_raw_output: Dict[str, Any]
    ai_recommendation: str
    officer_decision: str
    is_override: bool
    override_reason: Optional[str] = None
    inspector_id: str
    inspector_name: str
    inspection_status: str  # "Confirmed"
    created_at: datetime

# Complaint Schemas
class ComplaintCreate(BaseModel):
    toilet_id: str
    category: str  # "dirty_toilet", "dirty_floor", "missing_water", "broken_facility", "closed", "wrong_location", "other"
    description: str
    reporter_email: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    reference_number: str
    toilet_id: str
    toilet_name: Optional[str] = None
    user_id: Optional[str] = None
    reporter_email: Optional[str] = None
    category: str
    description: str
    photo_url: Optional[str] = None
    status: str  # "Received", "Under Investigation", "Action Taken", "Resolved"
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Cleaning Task Schemas
class TaskCreate(BaseModel):
    toilet_id: str
    notes: Optional[str] = None
    priority: str = "Medium"  # "Low", "Medium", "High", "Urgent"

class TaskUpdate(BaseModel):
    status: str  # "In Progress", "Cleaning Reported"
    completion_notes: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    toilet_id: str
    toilet_name: Optional[str] = None
    assigned_to_owner_id: str
    assigned_to_owner_name: Optional[str] = None
    assigned_by_id: str
    assigned_by_name: Optional[str] = None
    status: str  # "Pending", "In Progress", "Cleaning Reported", "Verified"
    priority: str
    notes: Optional[str] = None
    completion_notes: Optional[str] = None
    after_photo_url: Optional[str] = None
    claimed_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    created_at: datetime

# Analytics Schema
class MunicipalAnalytics(BaseModel):
    total_toilets: int
    clean_toilets: int
    needs_cleaning_toilets: int
    under_maintenance_toilets: int
    pending_approval_toilets: int
    pending_inspections: int
    completed_inspections: int
    open_complaints: int
    resolved_complaints: int
    overdue_tasks: int
    active_cleaning_tasks: int
    cleanliness_rate: float
    recent_inspections_trend: List[Dict[str, Any]]
    frequent_issue_categories: List[Dict[str, Any]]
    locality_breakdown: List[Dict[str, Any]]

# Notification Schema
class NotificationResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    target_role: Optional[str] = None
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime

