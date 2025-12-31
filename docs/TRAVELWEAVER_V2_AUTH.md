# TravelWeaver 2.0 - Authentication & Authorization Design

**Version**: 2.0
**Date**: 2025-12-31
**Status**: Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Strategy](#authentication-strategy)
3. [JWT Token Implementation](#jwt-token-implementation)
4. [Password Security](#password-security)
5. [Role-Based Access Control](#role-based-access-control)
6. [Permission System](#permission-system)
7. [API Security](#api-security)
8. [Session Management](#session-management)
9. [Security Best Practices](#security-best-practices)
10. [Implementation Guide](#implementation-guide)

---

## Overview

### Authentication vs Authorization

- **Authentication**: Verifying who the user is (login)
- **Authorization**: Verifying what the user can do (permissions)

### Security Goals

1. **Confidentiality**: Protect user data and credentials
2. **Integrity**: Ensure data is not tampered with
3. **Availability**: System remains accessible to legitimate users
4. **Non-repudiation**: Track who did what and when

### Technologies

- **JWT (JSON Web Tokens)**: Stateless authentication
- **bcrypt**: Password hashing
- **RBAC**: Role-based access control
- **HTTPS**: Encrypted communication
- **Rate Limiting**: Prevent abuse

---

## Authentication Strategy

### Authentication Flow

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │ 1. POST /api/v1/auth/login
      │    { email, password }
      ▼
┌────────────────────┐
│   API Gateway      │
└─────┬──────────────┘
      │ 2. Validate credentials
      ▼
┌────────────────────┐
│  Auth Service      │
│  - Check email     │
│  - Verify password │
│  - Generate tokens │
└─────┬──────────────┘
      │ 3. Return tokens
      ▼
┌────────────┐
│   Client   │
│  Store:    │
│  - access  │
│  - refresh │
└─────┬──────────────┘
      │ 4. Authenticated requests
      │    Authorization: Bearer {access_token}
      ▼
┌────────────────────┐
│   Protected API    │
│  - Verify JWT      │
│  - Check perms     │
│  - Process request │
└────────────────────┘
```

### Authentication Methods

1. **Email/Password** (Primary)
   - Standard username/password authentication
   - Email verification required
   - Password reset via email

2. **Social OAuth** (Future)
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In

3. **API Keys** (For integrations)
   - Organization-level API keys
   - Scoped permissions
   - Rate limiting

---

## JWT Token Implementation

### Token Structure

#### Access Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "usr_7x9m2k4n",
    "email": "john@example.com",
    "role": "dmc_admin",
    "org_id": "org_abc123",
    "permissions": [
      "bookings:write",
      "travelers:write",
      "settings:write"
    ],
    "iat": 1737116400,
    "exp": 1737120000,
    "type": "access"
  },
  "signature": "..."
}
```

**Lifetime**: 1 hour (3600 seconds)

#### Refresh Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "usr_7x9m2k4n",
    "email": "john@example.com",
    "iat": 1737116400,
    "exp": 1739708400,
    "type": "refresh"
  },
  "signature": "..."
}
```

**Lifetime**: 30 days (2592000 seconds)

### Token Generation

```python
# app/core/security.py

import jwt
from datetime import datetime, timedelta
from typing import Dict, Any
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 30


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
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


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
        "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode JWT token

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.JWTError:
        raise ValueError("Invalid token")
```

### Token Validation

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Get current user from JWT token

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
            detail=str(e)
        )
```

### Token Refresh

```python
@router.post("/auth/refresh")
async def refresh_access_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token

    Args:
        request: Refresh token request

    Returns:
        New access token
    """
    try:
        # Verify refresh token
        payload = verify_token(request.refresh_token)

        # Verify token type
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        # Get user from database
        user = get_user_by_id(payload.get("sub"))

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Generate new access token
        access_token = create_access_token(
            user_id=user["id"],
            email=user["email"],
            role=user["role"],
            organization_id=user["organization_id"],
            permissions=user["permissions"]
        )

        return {
            "access_token": access_token,
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
```

---

## Password Security

### Password Hashing

```python
# app/core/security.py

import bcrypt


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
```

### Password Requirements

**Minimum Requirements**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Implementation**:

```python
import re


def validate_password_strength(password: str) -> bool:
    """
    Validate password meets strength requirements

    Args:
        password: Plain text password

    Returns:
        True if password is strong enough

    Raises:
        ValueError: If password doesn't meet requirements
    """
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")

    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain uppercase letter")

    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain lowercase letter")

    if not re.search(r'\d', password):
        raise ValueError("Password must contain digit")

    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
        raise ValueError("Password must contain special character")

    return True
```

### Password Reset

```python
import secrets
from datetime import datetime, timedelta


def generate_reset_token() -> str:
    """Generate secure password reset token"""
    return secrets.token_urlsafe(32)


def create_password_reset(email: str, db) -> str:
    """
    Create password reset request

    Args:
        email: User email
        db: Database connection

    Returns:
        Reset token

    Raises:
        ValueError: If user not found
    """
    user = db.users.find_one({"email": email})

    if not user:
        raise ValueError("User not found")

    # Generate reset token
    reset_token = generate_reset_token()
    reset_expiry = datetime.utcnow() + timedelta(hours=1)

    # Update user with reset token
    db.users.update_one(
        {"email": email},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expiry": reset_expiry
            }
        }
    )

    # Send reset email (not implemented here)
    # send_password_reset_email(email, reset_token)

    return reset_token


def verify_reset_token(email: str, reset_token: str, db) -> bool:
    """
    Verify password reset token

    Args:
        email: User email
        reset_token: Reset token
        db: Database connection

    Returns:
        True if token is valid

    Raises:
        ValueError: If token is invalid or expired
    """
    user = db.users.find_one({"email": email})

    if not user:
        raise ValueError("User not found")

    if user.get("reset_token") != reset_token:
        raise ValueError("Invalid reset token")

    if user.get("reset_token_expiry") < datetime.utcnow():
        raise ValueError("Reset token has expired")

    return True
```

---

## Role-Based Access Control

### User Roles

| Role | Description | Level | Default Permissions |
|------|-------------|-------|---------------------|
| `system_admin` | System administrator | 0 | All permissions |
| `dmc_admin` | DMC organization admin | 1 | All org permissions |
| `dmc_manager` | DMC manager | 2 | Read all, write bookings/travelers |
| `dmc_staff` | DMC staff member | 3 | Read all, write limited |
| `traveler` | End traveler | 4 | Own bookings only |

### Role Hierarchy

```python
from enum import IntEnum


class UserRole(IntEnum):
    """User role with hierarchy"""

    SYSTEM_ADMIN = 0
    DMC_ADMIN = 1
    DMC_MANAGER = 2
    DMC_STAFF = 3
    TRAVELER = 4

    def has_higher_privilege_than(self, other: 'UserRole') -> bool:
        """Check if this role has higher privilege than another"""
        return self.value < other.value

    def can_manage_role(self, other: 'UserRole') -> bool:
        """Check if this role can manage another role"""
        return self.value <= other.value
```

### Role Permissions Mapping

```python
# app/core/permissions.py

from typing import List, Dict

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "system_admin": [
        "system:*",  # All system permissions
        "organizations:*",
        "users:*",
        "bookings:*",
        "travelers:*",
        "payments:*",
        "settings:*"
    ],
    "dmc_admin": [
        "organization:read",
        "organization:write",
        "users:read",
        "users:write",
        "users:invite",
        "users:deactivate",
        "bookings:read",
        "bookings:write",
        "bookings:cancel",
        "travelers:read",
        "travelers:write",
        "travelers:delete",
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
        "bookings:cancel",
        "travelers:read",
        "travelers:write",
        "payments:read",
        "payments:write",
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


def get_permissions_for_role(role: str) -> List[str]:
    """Get permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, [])
```

---

## Permission System

### Permission Format

```
resource:action[:scope]

Examples:
- bookings:read          # Read all bookings
- bookings:write         # Create/update bookings
- bookings:read:own      # Read only own bookings
- users:manage           # Manage users
- settings:*             # All settings permissions
```

### Permission Checking

```python
from typing import List


def has_permission(
    user_permissions: List[str],
    required_permission: str
) -> bool:
    """
    Check if user has required permission

    Args:
        user_permissions: User's permissions list
        required_permission: Required permission

    Returns:
        True if user has permission

    Examples:
        >>> has_permission(["bookings:write"], "bookings:write")
        True
        >>> has_permission(["bookings:*"], "bookings:write")
        True
        >>> has_permission(["bookings:read"], "bookings:write")
        False
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


def require_permission(required_permission: str):
    """
    Decorator to require specific permission

    Args:
        required_permission: Permission required to access endpoint

    Returns:
        Decorated function

    Example:
        @router.post("/bookings")
        @require_permission("bookings:write")
        async def create_booking(current_user: dict = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        async def wrapper(*args, current_user: dict = None, **kwargs):
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )

            user_permissions = current_user.get("permissions", [])

            if not has_permission(user_permissions, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {required_permission} required"
                )

            return await func(*args, current_user=current_user, **kwargs)

        return wrapper

    return decorator
```

### Permission Dependencies

```python
from fastapi import Depends, HTTPException, status


def require_permissions(*required_permissions: str):
    """
    FastAPI dependency to require multiple permissions

    Args:
        *required_permissions: Variable number of required permissions

    Returns:
        Dependency function

    Example:
        @router.delete("/bookings/{booking_id}")
        async def delete_booking(
            booking_id: str,
            current_user: dict = Depends(require_permissions("bookings:delete"))
        ):
            ...
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
```

---

## API Security

### HTTPS Only

**All API requests must use HTTPS** in production.

```python
# app/api/main.py

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app = FastAPI()

# Redirect HTTP to HTTPS in production
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

### CORS (Cross-Origin Resource Sharing)

```python
from fastapi.middleware.cors import CORSMiddleware

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.travelweaver.com",
        "https://travelweaver.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
    max_age=3600
)
```

### Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@router.post("/auth/login")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def login(request: Request, login_request: UserLogin):
    ...


@router.post("/api/v1/dmc/bookings")
@limiter.limit("100/hour")  # Max 100 booking requests per hour
async def create_booking(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    ...
```

### Request Validation

**All requests are validated using Pydantic models** before processing.

### SQL Injection Prevention

**All database queries use parameterized queries** (MongoDB and SQLite).

### XSS Prevention

```python
import bleach


def sanitize_html(content: str) -> str:
    """
    Sanitize HTML content to prevent XSS

    Args:
        content: HTML content

    Returns:
        Sanitized HTML
    """
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'a']
    allowed_attributes = {'a': ['href', 'title']}

    return bleach.clean(
        content,
        tags=allowed_tags,
        attributes=allowed_attributes,
        strip=True
    )
```

---

## Session Management

### Token Storage (Client-Side)

**Access Token**:
- Store in memory (recommended)
- OR store in httpOnly cookie
- Never store in localStorage (XSS vulnerability)

**Refresh Token**:
- Store in httpOnly cookie with secure flag
- Never expose to JavaScript

### Token Expiration Strategy

1. **Access token expires** (1 hour)
   - Client receives 401 Unauthorized
   - Client automatically refreshes using refresh token
   - New access token returned

2. **Refresh token expires** (30 days)
   - User must log in again

### Logout

```python
@router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (stateless - client removes tokens)

    For future token blacklisting:
    - Add token to Redis blacklist
    - Check blacklist on each request
    """
    # In stateless JWT, client simply discards tokens
    # For added security, implement token blacklisting

    return {"message": "Logged out successfully"}
```

### Token Blacklisting (Future Enhancement)

```python
# Using Redis for token blacklisting

import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)


def blacklist_token(token: str, expires_in: int):
    """Add token to blacklist"""
    redis_client.setex(f"blacklist:{token}", expires_in, "1")


def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return redis_client.exists(f"blacklist:{token}")
```

---

## Security Best Practices

### 1. Environment Variables

```bash
# .env (NEVER commit to git)

JWT_SECRET_KEY=your-super-secret-key-min-32-chars
DATABASE_URL=mongodb://localhost:27017/travelweaver
AMADEUS_API_KEY=your-amadeus-key
AMADEUS_API_SECRET=your-amadeus-secret
```

### 2. Secret Key Generation

```python
import secrets

# Generate secure secret key
secret_key = secrets.token_urlsafe(32)
print(secret_key)
```

### 3. Input Validation

- **Always validate** all user inputs using Pydantic
- **Sanitize** HTML content
- **Limit** string lengths
- **Validate** email formats, phone numbers, dates

### 4. Error Messages

**Never reveal sensitive information in error messages**:

```python
# BAD
raise HTTPException(
    status_code=401,
    detail="User john@example.com not found in database"
)

# GOOD
raise HTTPException(
    status_code=401,
    detail="Invalid credentials"
)
```

### 5. Logging

**Log security events**:
- Failed login attempts
- Password resets
- Permission denials
- Token refreshes

```python
import logging

logger = logging.getLogger("security")

# Log failed login
logger.warning(f"Failed login attempt for email: {email} from IP: {ip}")

# Log permission denial
logger.warning(f"Permission denied: {user_id} tried to access {resource}")
```

### 6. Audit Trail

**Track all important actions**:

```python
def create_audit_log(
    user_id: str,
    action: str,
    resource: str,
    resource_id: str,
    details: Dict[str, Any],
    db
):
    """Create audit log entry"""
    db.audit_logs.insert_one({
        "user_id": user_id,
        "action": action,
        "resource": resource,
        "resource_id": resource_id,
        "details": details,
        "timestamp": datetime.utcnow(),
        "ip_address": request.client.host
    })
```

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
pip install python-jose[cryptography]
pip install passlib[bcrypt]
pip install python-multipart
pip install slowapi
```

### Step 2: Create Security Module

```
app/core/
├── __init__.py
├── security.py         # JWT, password hashing
├── permissions.py      # Permission definitions
└── audit.py            # Audit logging
```

### Step 3: Implement Authentication Routes

```python
# app/api/routes/auth.py

from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserLogin, TokenResponse
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(login_request: UserLogin):
    """User login"""
    # Get user from database
    user = db.users.find_one({"email": login_request.email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Verify password
    if not verify_password(login_request.password, user["password_hash"]):
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
        organization_id=user.get("organization_id"),
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

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "expires_in": 3600,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "organization_id": user.get("organization_id"),
            "permissions": user.get("permissions", [])
        }
    }
```

### Step 4: Protect Routes

```python
# Example protected route

@router.get("/dmc/bookings")
async def list_bookings(
    current_user: dict = Depends(require_permissions("bookings:read"))
):
    """List bookings (requires bookings:read permission)"""
    bookings = db.bookings.find({
        "organization_id": current_user["organization_id"]
    })

    return {"bookings": list(bookings)}
```

### Step 5: Testing

```python
# tests/test_auth.py

def test_login_success():
    """Test successful login"""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Test123!@#"
    })

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrong_password"
    })

    assert response.status_code == 401


def test_protected_route_without_token():
    """Test accessing protected route without token"""
    response = client.get("/api/v1/dmc/bookings")

    assert response.status_code == 401


def test_protected_route_with_valid_token():
    """Test accessing protected route with valid token"""
    # Login first
    login_response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "Test123!@#"
    })

    token = login_response.json()["access_token"]

    # Access protected route
    response = client.get(
        "/api/v1/dmc/bookings",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
```

---

**End of Authentication & Authorization Design**

This document provides a complete authentication and authorization system design with JWT tokens, role-based access control, and comprehensive security measures.
