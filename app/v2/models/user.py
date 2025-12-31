"""
User Models for TravelWeaver V2
"""

from pydantic import Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from app.v2.models.base import MongoBaseModel, APIBaseModel


class UserRole(str, Enum):
    """User role enumeration"""

    DMC_ADMIN = "dmc_admin"
    DMC_MANAGER = "dmc_manager"
    DMC_STAFF = "dmc_staff"
    TRAVELER = "traveler"
    SYSTEM_ADMIN = "system_admin"


class UserStatus(str, Enum):
    """User status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class User(MongoBaseModel):
    """User document model"""

    email: EmailStr = Field(..., description="User email address")
    password_hash: str = Field(..., description="Hashed password")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    organization_id: Optional[str] = None
    permissions: List[str] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    last_login: Optional[datetime] = None
    email_verified: bool = False
    verification_code: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        """Ensure email is lowercase"""
        return v.lower()


class UserCreate(APIBaseModel):
    """User creation request"""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain special character")
        return v


class UserLogin(APIBaseModel):
    """User login request"""

    email: EmailStr
    password: str


class UserResponse(APIBaseModel):
    """User response (excludes sensitive data)"""

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    status: UserStatus
    organization_id: Optional[str] = None
    permissions: List[str]
    last_login: Optional[datetime] = None
    created_at: datetime


class TokenResponse(APIBaseModel):
    """Authentication token response"""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    user: UserResponse
