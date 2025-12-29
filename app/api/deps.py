"""
API dependencies for TravelWeaver Platform
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from app.core.config import settings
from app.core.security import get_current_user
from app.amadeus_client import AmadeusClient
# User lookup will be handled by get_current_user


def get_amadeus_client() -> Optional[AmadeusClient]:
    """Get Amadeus client instance"""
    if not settings.AMADEUS_CLIENT_ID or not settings.AMADEUS_CLIENT_SECRET:
        return None
    
    return AmadeusClient(
        api_key=settings.AMADEUS_CLIENT_ID,
        api_secret=settings.AMADEUS_CLIENT_SECRET,
        environment="test" if "test" in settings.AMADEUS_BASE_URL else "production"
    )


def require_role(allowed_roles: list):
    """Dependency to require specific user roles"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get('role') not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin role"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_manager_or_admin(current_user: dict = Depends(get_current_user)):
    """Require manager or admin role"""
    if current_user.get('role') not in ['admin', 'manager']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager or admin access required"
        )
    return current_user

