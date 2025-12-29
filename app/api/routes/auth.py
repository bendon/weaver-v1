"""
Authentication routes
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.database import create_organization, create_user, get_user_by_email, get_user_by_id

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    organization_name: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    organization_id: str


@router.post("/login")
async def login(request: LoginRequest):
    """Login endpoint"""
    # Validate input
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Get user by email
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user has a password hash
    if not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(request.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user is active
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Update last login
    try:
        from app.core.database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_login_at = datetime('now') WHERE id = ?", (user['id'],))
        conn.commit()
        conn.close()
    except Exception as e:
        # Log error but don't fail login
        print(f"Warning: Failed to update last_login_at: {e}")
    
    # Create token
    token = create_access_token({"sub": user['id'], "email": user['email'], "role": user['role']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "organization_id": user['organization_id']
        }
    }


@router.post("/register")
async def register(request: RegisterRequest):
    """Register new organization and user"""
    # Check if user exists
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create organization
    org_slug = request.organization_name.lower().replace(' ', '-')[:50]
    org_id = create_organization(name=request.organization_name, slug=org_slug)
    
    if not org_id:
        raise HTTPException(status_code=500, detail="Failed to create organization")
    
    # Create user
    password_hash = hash_password(request.password)
    user_id = create_user(
        email=request.email,
        password_hash=password_hash,
        name=request.name,
        organization_id=org_id,
        role="admin"
    )
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Return token
    token = create_access_token({"sub": user_id, "email": request.email, "role": "admin"})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": request.email,
            "name": request.name,
            "role": "admin",
            "organization_id": org_id
        }
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user"""
    return {
        "id": current_user['id'],
        "email": current_user['email'],
        "name": current_user['name'],
        "role": current_user['role'],
        "organization_id": current_user['organization_id']
    }

