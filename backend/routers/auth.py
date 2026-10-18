import uuid
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from database.db import db_manager, hash_password, verify_password
from models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await db_manager.find_one("users", {"id": user_id})
        return user
    except Exception:
        return None

def require_auth(current_user: Optional[dict] = Depends(get_current_user)) -> dict:
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in."
        )
    return current_user

def require_roles(allowed_roles: list):
    def role_checker(current_user: dict = Depends(require_auth)) -> dict:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of these roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserCreate):
    existing = await db_manager.find_one("users", {"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )

    # Secure role assignment (cannot register as officer directly unless initial system bootstrap)
    role = user_in.role
    if role not in ["officer", "owner", "citizen"]:
        role = "citizen"

    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    new_user = {
        "id": user_id,
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "role": role,
        "hashed_password": hash_password(user_in.password),
        "phone": user_in.phone,
        "organization": user_in.organization,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db_manager.insert_one("users", new_user)
    
    token = create_access_token({"sub": user_id, "role": role, "email": new_user["email"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=new_user["email"],
            full_name=new_user["full_name"],
            role=new_user["role"],
            phone=new_user["phone"],
            organization=new_user["organization"],
            is_active=new_user["is_active"],
            created_at=datetime.fromisoformat(new_user["created_at"])
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db_manager.find_one("users", {"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact municipal administrator."
        )

    token = create_access_token({"sub": user["id"], "role": user["role"], "email": user["email"]})
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            phone=user.get("phone"),
            organization=user.get("organization"),
            is_active=user.get("is_active", True),
            created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
        )
    )

@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(require_auth)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        phone=current_user.get("phone"),
        organization=current_user.get("organization"),
        is_active=current_user.get("is_active", True),
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )
