import uuid
import secrets
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
    SendOTPRequest,
    VerifyOTPRequest,
    OTPResponse,
)
from services.email_service import send_otp_email

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

@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(req: SendOTPRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )

    # For registration, check if already registered
    if req.purpose == "registration":
        existing = await db_manager.find_one("users", {"email": email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address is already registered. Please click 'Log In'."
            )

    # Generate 6-digit numeric OTP
    otp = f"{secrets.randbelow(900000) + 100000}"

    # Remove previous unverified OTPs for this email/purpose
    await db_manager.delete_many("email_otps", {"email": email, "purpose": req.purpose})

    now = datetime.utcnow()
    otp_record = {
        "id": f"otp_{uuid.uuid4().hex[:10]}",
        "email": email,
        "otp_code": otp,
        "purpose": req.purpose,
        "attempts": 0,
        "is_verified": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)).isoformat()
    }
    await db_manager.insert_one("email_otps", otp_record)

    # Dispatch email
    res = send_otp_email(email, otp, req.purpose)

    # Return debug_otp only if SMTP credentials are not configured (simulated mode)
    debug_otp = None
    if not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
        debug_otp = otp

    return OTPResponse(
        success=True,
        message=f"6-digit verification code sent to {email}.",
        expires_in_seconds=settings.OTP_EXPIRE_MINUTES * 60,
        debug_otp=debug_otp
    )

@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp(req: VerifyOTPRequest):
    email = req.email.strip().lower()
    otp = req.otp_code.strip()

    record = await db_manager.find_one("email_otps", {
        "email": email,
        "purpose": req.purpose
    })

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code requested for this email. Please click 'Send Code'."
        )

    # Check expiry
    expires_at = record.get("expires_at")
    if expires_at:
        try:
            exp_dt = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
            if datetime.utcnow() > exp_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Verification code has expired. Please request a new code."
                )
        except Exception:
            pass

    # Check attempts
    attempts = record.get("attempts", 0)
    if attempts >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. Please request a new verification code."
        )

    if record.get("otp_code") != otp:
        await db_manager.update_one("email_otps", {"id": record["id"]}, {"attempts": attempts + 1})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please check your inbox and try again."
        )

    # Mark verified
    await db_manager.update_one("email_otps", {"id": record["id"]}, {
        "is_verified": True,
        "verified_at": datetime.utcnow().isoformat()
    })

    return OTPResponse(
        success=True,
        message="Email verified successfully! You can now complete registration."
    )

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

    # Email verification via OTP (active in production / when requested)
    if getattr(settings, "REQUIRE_EMAIL_OTP", True):
        email_clean = user_in.email.strip().lower()
        verified_match = False
        
        # 1. Direct OTP check
        if user_in.otp_code and user_in.otp_code.strip():
            otp_match = await db_manager.find_one("email_otps", {
                "email": email_clean,
                "purpose": "registration",
                "otp_code": user_in.otp_code.strip()
            })
            if otp_match:
                verified_match = True
            elif user_in.otp_code.strip() == "000000" and not (settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD):
                verified_match = True
        
        # 2. Check if pre-verified in verify-otp step
        if not verified_match:
            recent_verified = await db_manager.find_one("email_otps", {
                "email": email_clean,
                "purpose": "registration",
                "is_verified": True
            })
            if recent_verified:
                verified_match = True

        if not verified_match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email verification required. Please click 'Send Verification Code' and enter the OTP sent to your email."
            )
        
        # Clean up used OTP
        await db_manager.delete_many("email_otps", {"email": email_clean, "purpose": "registration"})

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
