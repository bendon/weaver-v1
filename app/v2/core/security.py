"""
Security utilities for TravelWeaver V2
Handles JWT tokens, password hashing, and authentication
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.v2.core.config import settings


security = HTTPBearer()


# Password Hashing
def hash_password(password: str) -> str:
    """
    Hash password using bcrypt

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify password against hash

    Args:
        password: Plain text password
        password_hash: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return bcrypt.checkpw(
        password.encode('utf-8'),
        password_hash.encode('utf-8')
    )


# JWT Token Generation
def create_access_token(
    user_id: str,
    email: str,
    role: str,
    organization_id: str,
    permissions: List[str]
) -> str:
    """
    Create JWT access token

    Args:
        user_id: User ID
        email: User email
        role: User role
        organization_id: Organization ID
        permissions: List of permissions

    Returns:
        JWT access token string
    """
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "org_id": organization_id,
        "permissions": permissions,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str, email: str) -> str:
    """
    Create JWT refresh token

    Args:
        user_id: User ID
        email: User email

    Returns:
        JWT refresh token string
    """
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        ValueError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError:
        raise ValueError("Invalid token")


# FastAPI Dependency for Authentication
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user from JWT token (FastAPI dependency)

    Args:
        credentials: HTTP Bearer credentials

    Returns:
        User information from token

    Raises:
        HTTPException: If token is invalid
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)

        # Verify token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "organization_id": payload.get("org_id"),
            "permissions": payload.get("permissions", [])
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"}
        )


# Permission Checking
def has_permission(user_permissions: List[str], required_permission: str) -> bool:
    """
    Check if user has required permission

    Args:
        user_permissions: User's permissions list
        required_permission: Required permission

    Returns:
        True if user has permission
    """
    # Check for exact match
    if required_permission in user_permissions:
        return True

    # Check for wildcard permissions
    resource = required_permission.split(":")[0]
    wildcard_permission = f"{resource}:*"

    if wildcard_permission in user_permissions:
        return True

    # Check for super admin permission
    if "*:*" in user_permissions or "system:*" in user_permissions:
        return True

    return False


def require_permissions(*required_permissions: str):
    """
    FastAPI dependency to require multiple permissions

    Args:
        *required_permissions: Variable number of required permissions

    Returns:
        Dependency function
    """
    def permission_checker(current_user: dict = Depends(get_current_user)):
        user_permissions = current_user.get("permissions", [])

        for required_permission in required_permissions:
            if not has_permission(user_permissions, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Missing required permission: {required_permission}"
                )

        return current_user

    return permission_checker
