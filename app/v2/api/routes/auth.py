"""
Authentication Routes for TravelWeaver V2
Handles user registration, login, and token management
"""

from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from app.v2.models.user import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
    UserRole
)
from app.v2.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token
)
from app.v2.core.database import get_mongo_db
from app.v2.core.config import settings


router = APIRouter()


# Role permissions mapping
ROLE_PERMISSIONS = {
    "system_admin": ["system:*"],
    "dmc_admin": [
        "organization:read",
        "organization:write",
        "users:read",
        "users:write",
        "bookings:read",
        "bookings:write",
        "travelers:read",
        "travelers:write",
        "payments:read",
        "payments:write",
        "settings:read",
        "settings:write"
    ],
    "dmc_manager": [
        "organization:read",
        "users:read",
        "bookings:read",
        "bookings:write",
        "travelers:read",
        "travelers:write",
        "payments:read",
        "settings:read"
    ],
    "dmc_staff": [
        "organization:read",
        "users:read",
        "bookings:read",
        "bookings:write",
        "travelers:read",
        "travelers:write",
        "payments:read"
    ],
    "traveler": [
        "bookings:read:own",
        "travelers:read:own",
        "travelers:write:own"
    ]
}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user

    Args:
        user_data: User registration data

    Returns:
        Created user (without sensitive data)

    Raises:
        HTTPException: If email already exists
    """
    db = get_mongo_db()

    # Check if user already exists
    existing_user = db.users.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    password_hash = hash_password(user_data.password)

    # Get permissions for role
    permissions = ROLE_PERMISSIONS.get(user_data.role, [])

    # Create user document
    user_doc = {
        "email": user_data.email.lower(),
        "password_hash": password_hash,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "status": "active",
        "organization_id": None,  # Will be set when user creates/joins org
        "permissions": permissions,
        "preferences": {},
        "last_login": None,
        "email_verified": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    # Insert user
    result = db.users.insert_one(user_doc)

    # Return user response
    return UserResponse(
        id=str(result.inserted_id),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        role=user_doc["role"],
        status=user_doc["status"],
        organization_id=user_doc["organization_id"],
        permissions=user_doc["permissions"],
        last_login=user_doc["last_login"],
        created_at=user_doc["created_at"]
    )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """
    Login user and return JWT tokens

    Args:
        login_data: User login credentials

    Returns:
        Access token, refresh token, and user info

    Raises:
        HTTPException: If credentials are invalid
    """
    db = get_mongo_db()

    # Get user from database
    user = db.users.find_one({"email": login_data.email.lower()})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Check if user is active
    if user["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )

    # Generate tokens
    access_token = create_access_token(
        user_id=str(user["_id"]),
        email=user["email"],
        role=user["role"],
        organization_id=user.get("organization_id", ""),
        permissions=user.get("permissions", [])
    )

    refresh_token = create_refresh_token(
        user_id=str(user["_id"]),
        email=user["email"]
    )

    # Update last login
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    # Return token response
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            status=user["status"],
            organization_id=user.get("organization_id"),
            permissions=user.get("permissions", []),
            last_login=user.get("last_login"),
            created_at=user["created_at"]
        )
    )


@router.get("/health")
async def health_check():
    """Health check for auth service"""
    return {
        "status": "healthy",
        "service": "auth",
        "version": settings.APP_VERSION
    }
