"""
Security utilities for TravelWeaver Platform
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: Dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict]:
    """Decode and verify a JWT access token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None)
) -> Dict:
    """Get current authenticated user from JWT token (supports both V1 and V2 tokens)"""
    # Try to get token from HTTPBearer first, then from Authorization header
    token = None
    
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Try V1 token first
    payload = decode_access_token(token)
    
    # If V1 token fails, try V2 token
    if payload is None:
        try:
            from app.v2.core.config import settings as v2_settings
            
            # Try to decode with V2 secret
            try:
                payload = jwt.decode(
                    token, 
                    v2_settings.JWT_SECRET_KEY, 
                    algorithms=[v2_settings.JWT_ALGORITHM]
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.InvalidTokenError as e:
                # V2 token also invalid - this is expected if it's a V1 token
                print(f"V2 token decode failed (expected for V1 tokens): {type(e).__name__}")
                payload = None
                # Don't raise, let it fall through to the final error
            else:
                # V2 token successfully decoded
                # V2 token structure - convert to V1 format
                user_id = payload.get("sub")
                org_id = payload.get("org_id") or payload.get("organization_id") or ""
                
                # Verify token type
                if payload.get("type") != "access":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid token type"
                    )
                
                if user_id:
                    # Return V2 user format (org_id can be empty for new users)
                    return {
                        "id": user_id,
                        "email": payload.get("email"),
                        "role": payload.get("role"),
                        "organization_id": org_id if org_id else None,
                        "permissions": payload.get("permissions", [])
                    }
                else:
                    # V2 token decoded but missing user_id
                    print(f"V2 token decoded but missing user_id")
                    payload = None
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except ImportError as e:
            # V2 module not available - this is OK, just use V1
            print(f"V2 config not available: {str(e)}")
            payload = None
        except Exception as e:
            # Unexpected error - log but continue
            print(f"Unexpected error checking V2 token: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            payload = None
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Check if this is a V2 token (has org_id instead of organization_id)
    org_id = payload.get("org_id")
    if org_id:
        # V2 token - return directly without database lookup
        return {
            "id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role"),
            "organization_id": org_id,
            "permissions": payload.get("permissions", [])
        }
    
    # V1 token - get user from database
    from app.core.database import get_user_by_id
    user = get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.get('is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user

