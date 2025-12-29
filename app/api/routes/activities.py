"""
Activity routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    get_booking_by_id, create_activity, get_activity_by_id,
    get_activities_by_booking, update_activity, delete_activity
)

router = APIRouter()


class CreateActivityRequest(BaseModel):
    activity_name: str
    scheduled_datetime: str
    activity_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    supplier_name: Optional[str] = None
    confirmation_number: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    description: Optional[str] = None
    notes: Optional[str] = None


class UpdateActivityRequest(BaseModel):
    activity_name: Optional[str] = None
    scheduled_datetime: Optional[str] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    confirmation_number: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None


@router.post("/bookings/{booking_id}/activities")
async def add_activity_to_booking(
    booking_id: str,
    request: CreateActivityRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add an activity to a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    activity_id = create_activity(
        booking_id=booking_id,
        activity_name=request.activity_name,
        scheduled_datetime=request.scheduled_datetime,
        activity_type=request.activity_type,
        duration_minutes=request.duration_minutes,
        location=request.location,
        address=request.address,
        latitude=request.latitude,
        longitude=request.longitude,
        supplier_name=request.supplier_name,
        confirmation_number=request.confirmation_number,
        price=request.price,
        currency=request.currency,
        description=request.description,
        notes=request.notes
    )
    
    if not activity_id:
        raise HTTPException(status_code=500, detail="Failed to create activity")
    
    return get_activity_by_id(activity_id)


@router.get("/bookings/{booking_id}/activities")
async def get_booking_activities(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all activities for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    activities = get_activities_by_booking(booking_id)
    return {"activities": activities, "total": len(activities)}


@router.get("/{activity_id}")
async def get_activity(
    activity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get activity by ID"""
    activity = get_activity_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    booking = get_booking_by_id(activity['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return activity


@router.put("/{activity_id}")
async def update_activity_endpoint(
    activity_id: str,
    request: UpdateActivityRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update activity"""
    activity = get_activity_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    booking = get_booking_by_id(activity['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = request.dict(exclude_unset=True)
    if update_activity(activity_id, **update_data):
        return get_activity_by_id(activity_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update activity")


@router.delete("/{activity_id}")
async def delete_activity_endpoint(
    activity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete activity"""
    activity = get_activity_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    booking = get_booking_by_id(activity['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if delete_activity(activity_id):
        return {"success": True, "message": "Activity deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete activity")

