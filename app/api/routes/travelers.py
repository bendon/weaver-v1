"""
Traveler routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import create_traveler, get_traveler_by_id

router = APIRouter()


class CreateTravelerRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    phone_country_code: Optional[str] = None


@router.post("")
async def create_traveler_endpoint(
    request: CreateTravelerRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new traveler"""
    traveler_id = create_traveler(
        organization_id=current_user['organization_id'],
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        email=request.email,
        phone_country_code=request.phone_country_code
    )
    
    if not traveler_id:
        raise HTTPException(status_code=500, detail="Failed to create traveler")
    
    traveler = get_traveler_by_id(traveler_id)
    return traveler


@router.get("")
async def get_travelers_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """Get all travelers for organization"""
    from app.core.database import get_travelers_by_organization
    travelers = get_travelers_by_organization(current_user['organization_id'])
    return {"travelers": travelers, "total": len(travelers)}


@router.get("/{traveler_id}")
async def get_traveler_endpoint(
    traveler_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get traveler by ID"""
    traveler = get_traveler_by_id(traveler_id)
    if not traveler:
        raise HTTPException(status_code=404, detail="Traveler not found")
    
    # Check authorization
    if traveler['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return traveler


@router.put("/{traveler_id}")
async def update_traveler_endpoint(
    traveler_id: str,
    request: CreateTravelerRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update traveler"""
    traveler = get_traveler_by_id(traveler_id)
    if not traveler:
        raise HTTPException(status_code=404, detail="Traveler not found")
    
    # Check authorization
    if traveler['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    from app.core.database import update_traveler
    update_data = request.dict(exclude_unset=True)
    if update_traveler(traveler_id, **update_data):
        return get_traveler_by_id(traveler_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update traveler")

