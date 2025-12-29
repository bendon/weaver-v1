"""
Flight routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.api.deps import get_amadeus_client
from app.amadeus_client import AmadeusClient

router = APIRouter()


class FlightSearchRequest(BaseModel):
    origin: str
    destination: str
    departure_date: str
    return_date: Optional[str] = None
    adults: int = 1
    children: int = 0
    infants: int = 0
    max_results: int = 10


@router.post("/search")
async def search_flights(
    request: FlightSearchRequest,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """Search for flights using Amadeus API"""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Amadeus API credentials not configured"
        )
    
    try:
        results = client.search_flights(
            origin=request.origin,
            destination=request.destination,
            departure_date=request.departure_date,
            return_date=request.return_date,
            adults=request.adults,
            children=request.children,
            infants=request.infants,
            max_results=request.max_results
        )
        
        return {
            "success": True,
            "data": results.get("data"),
            "meta": results.get("meta")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor")
async def get_flights_to_monitor(current_user: dict = Depends(get_current_user)):
    """Get flights requiring monitoring"""
    try:
        from app.database import get_active_flights_for_monitoring
        from app.core.database import get_booking_by_id
        
        flights = get_active_flights_for_monitoring()
        # Filter by organization
        bookings = {}
        for flight in flights:
            booking_id = flight.get('booking_id')
            if booking_id:
                booking = get_booking_by_id(booking_id)
                if booking and booking.get('organization_id') == current_user['organization_id']:
                    if booking_id not in bookings:
                        bookings[booking_id] = booking
                    flight['booking'] = booking
        
        # Filter flights that belong to user's organization
        org_flights = [
            f for f in flights 
            if f.get('booking_id') and f.get('booking_id') in bookings
        ]
        
        return {"flights": org_flights, "total": len(org_flights)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
