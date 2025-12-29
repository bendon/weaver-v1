"""
Booking routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    create_booking, get_booking_by_id, get_booking_by_code,
    get_bookings_by_organization, update_booking, delete_booking,
    link_traveler_to_booking, get_booking_travelers
)

router = APIRouter()


class CreateBookingRequest(BaseModel):
    title: str
    start_date: str
    end_date: str
    total_travelers: int = 1
    notes: Optional[str] = None


class UpdateBookingRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None
    total_price: Optional[float] = None
    currency: Optional[str] = None


class LinkTravelerRequest(BaseModel):
    traveler_id: str
    is_primary: bool = False


@router.post("")
async def create_booking_endpoint(
    request: CreateBookingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new booking"""
    booking_id = create_booking(
        organization_id=current_user['organization_id'],
        created_by=current_user['id'],
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date,
        total_travelers=request.total_travelers,
        notes=request.notes
    )
    
    if not booking_id:
        raise HTTPException(status_code=500, detail="Failed to create booking")
    
    booking = get_booking_by_id(booking_id)
    return booking


@router.get("")
async def get_bookings(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all bookings for organization"""
    bookings = get_bookings_by_organization(
        current_user['organization_id'],
        status=status
    )
    return {"bookings": bookings, "total": len(bookings)}


@router.get("/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Get booking by ID"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied")
    
    return booking


@router.get("/code/{booking_code}")
async def get_booking_by_code_endpoint(booking_code: str):
    """Get booking by code (public access)"""
    booking = get_booking_by_code(booking_code)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.put("/{booking_id}")
async def update_booking_endpoint(
    booking_id: str,
    request: UpdateBookingRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Update booking
    update_data = request.dict(exclude_unset=True)
    if update_booking(booking_id, **update_data):
        return get_booking_by_id(booking_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update booking")


@router.delete("/{booking_id}")
async def delete_booking_endpoint(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied")
    
    if delete_booking(booking_id):
        return {"success": True, "message": "Booking deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete booking")


@router.post("/{booking_id}/travelers")
async def link_traveler_to_booking_endpoint(
    booking_id: str,
    request: LinkTravelerRequest,
    current_user: dict = Depends(get_current_user)
):
    """Link a traveler to a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    link_id = link_traveler_to_booking(booking_id, request.traveler_id, request.is_primary)
    if not link_id:
        raise HTTPException(status_code=500, detail="Failed to link traveler")
    
    return {"success": True, "link_id": link_id}


@router.get("/{booking_id}/travelers")
async def get_booking_travelers_endpoint(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all travelers for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    travelers = get_booking_travelers(booking_id)
    return {"travelers": travelers, "total": len(travelers)}


@router.post("/{booking_id}/send")
async def send_itinerary_endpoint(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Send itinerary to traveler via WhatsApp"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # TODO: Implement WhatsApp sending
    # For now, just mark as sent
    update_booking(booking_id, itinerary_sent_at=datetime.now().isoformat())
    
    return {
        "success": True,
        "message": "Itinerary sending functionality coming soon",
        "booking_id": booking_id
    }


@router.get("/{booking_id}/messages")
async def get_booking_messages_endpoint(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get messages for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # TODO: Implement message retrieval
    return {"messages": [], "total": 0}

