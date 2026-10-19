import uuid
from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from database.db import db_manager, hash_password, verify_password
from models.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

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
        if verify_password(user_in.password, existing.get("hashed_password", "")):
            # If the user already registered with this exact password, log them in directly
            token = create_access_token({"sub": existing["id"], "role": existing.get("role", "citizen"), "email": existing["email"]})
            created_at_val = existing.get("created_at")
            if isinstance(created_at_val, str):
                try:
                    dt = datetime.fromisoformat(created_at_val)
                except Exception:
                    dt = datetime.utcnow()
            else:
                dt = datetime.utcnow()

            return TokenResponse(
                access_token=token,
                user=UserResponse(
                    id=existing["id"],
                    email=existing["email"],
                    full_name=existing.get("full_name", ""),
                    role=existing.get("role", "citizen"),
                    phone=existing.get("phone"),
                    organization=existing.get("organization"),
                    is_active=existing.get("is_active", True),
                    created_at=dt
                )
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered. Please click 'Log In' to access your account."
        )

    # Secure role assignment: officer accounts require valid municipal invite key unless system bootstrap
    role = user_in.role
    if role == "officer":
        is_invite_valid = bool(user_in.invite_code and user_in.invite_code.strip() == settings.MUNICIPAL_INVITE_KEY)
        existing_officers = await db_manager.find("users", {"role": "officer"})
        if not is_invite_valid and len(existing_officers) > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Municipal Officer accounts cannot be created publicly without an authorized municipal officer key. Contact your municipal health administration."
            )
    elif role not in ["owner", "citizen"]:
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

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db_manager.find_one("users", {"email": req.email.lower()})
    if not user:
        return {
            "success": True,
            "message": "If this email exists in our registry, reset instructions have been issued."
        }
    
    expire = datetime.utcnow() + timedelta(hours=1)
    reset_token = jwt.encode(
        {"sub": user["id"], "email": user["email"], "type": "password_reset", "exp": expire},
        settings.JWT_SECRET,
        algorithm=settings.ALGORITHM
    )
    await db_manager.update_one("users", {"id": user["id"]}, {"reset_token": reset_token})
    return {
        "success": True,
        "message": "Password reset token generated successfully. Please enter your new password.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    try:
        payload = jwt.decode(req.token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token type.")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token.")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset token has expired. Please request a new one.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or malformed reset token.")

    user = await db_manager.find_one("users", {"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters.")

    new_hashed = hash_password(req.new_password)
    now = datetime.utcnow().isoformat()
    await db_manager.update_one("users", {"id": user_id}, {
        "hashed_password": new_hashed,
        "reset_token": None,
        "updated_at": now
    })

    return {
        "success": True,
        "message": "Password reset successfully. You can now log in with your new password."
    }

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
