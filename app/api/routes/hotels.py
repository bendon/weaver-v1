"""
Hotel routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    get_booking_by_id, create_hotel, get_hotel_by_id,
    get_hotels_by_booking, update_hotel, delete_hotel
)

router = APIRouter()


class CreateHotelRequest(BaseModel):
    hotel_name: str
    check_in_date: str
    check_out_date: str
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confirmation_number: Optional[str] = None
    check_in_time: Optional[str] = "14:00"
    check_out_time: Optional[str] = "11:00"
    room_type: Optional[str] = None
    board_basis: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    notes: Optional[str] = None


class UpdateHotelRequest(BaseModel):
    hotel_name: Optional[str] = None
    confirmation_number: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    room_type: Optional[str] = None
    board_basis: Optional[str] = None
    price: Optional[float] = None
    notes: Optional[str] = None


@router.post("/bookings/{booking_id}/hotels")
async def add_hotel_to_booking(
    booking_id: str,
    request: CreateHotelRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a hotel to a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    hotel_id = create_hotel(
        booking_id=booking_id,
        hotel_name=request.hotel_name,
        check_in_date=request.check_in_date,
        check_out_date=request.check_out_date,
        address=request.address,
        city=request.city,
        country=request.country,
        phone=request.phone,
        email=request.email,
        website=request.website,
        latitude=request.latitude,
        longitude=request.longitude,
        confirmation_number=request.confirmation_number,
        check_in_time=request.check_in_time,
        check_out_time=request.check_out_time,
        room_type=request.room_type,
        board_basis=request.board_basis,
        price=request.price,
        currency=request.currency,
        notes=request.notes
    )
    
    if not hotel_id:
        raise HTTPException(status_code=500, detail="Failed to create hotel")
    
    return get_hotel_by_id(hotel_id)


@router.get("/bookings/{booking_id}/hotels")
async def get_booking_hotels(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all hotels for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    hotels = get_hotels_by_booking(booking_id)
    return {"hotels": hotels, "total": len(hotels)}


@router.get("/{hotel_id}")
async def get_hotel(
    hotel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get hotel by ID"""
    hotel = get_hotel_by_id(hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    booking = get_booking_by_id(hotel['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return hotel


@router.put("/{hotel_id}")
async def update_hotel_endpoint(
    hotel_id: str,
    request: UpdateHotelRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update hotel"""
    hotel = get_hotel_by_id(hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    booking = get_booking_by_id(hotel['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = request.dict(exclude_unset=True)
    if update_hotel(hotel_id, **update_data):
        return get_hotel_by_id(hotel_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update hotel")


@router.delete("/{hotel_id}")
async def delete_hotel_endpoint(
    hotel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete hotel"""
    hotel = get_hotel_by_id(hotel_id)
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    booking = get_booking_by_id(hotel['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if delete_hotel(hotel_id):
        return {"success": True, "message": "Hotel deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete hotel")

