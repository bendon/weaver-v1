"""
Public routes (no authentication required)
"""

from fastapi import APIRouter, HTTPException
from app.core.database import get_booking_by_code

router = APIRouter()


@router.get("/itinerary/{booking_code}")
async def get_public_itinerary(booking_code: str):
    """Get itinerary by booking code (public, no auth required)"""
    booking = get_booking_by_code(booking_code)
    if not booking:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    
    # Return basic booking info
    # TODO: Compile full itinerary with flights, hotels, etc.
    return {
        "booking_code": booking['booking_code'],
        "title": booking['title'],
        "start_date": booking['start_date'],
        "end_date": booking['end_date'],
        "status": booking['status']
    }

