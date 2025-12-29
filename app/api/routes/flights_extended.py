"""
Extended flight routes (CRUD operations)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    get_booking_by_id, create_flight, get_flight_by_id,
    get_flights_by_booking, update_flight, delete_flight
)
from app.api.deps import get_amadeus_client
from app.amadeus_client import AmadeusClient
from datetime import datetime

router = APIRouter()


class CreateFlightRequest(BaseModel):
    carrier_code: str
    flight_number: str
    departure_date: str
    departure_airport: str
    arrival_airport: str
    scheduled_departure: str
    scheduled_arrival: str
    flight_type: Optional[str] = "outbound"
    estimated_departure: Optional[str] = None
    estimated_arrival: Optional[str] = None
    departure_terminal: Optional[str] = None
    arrival_terminal: Optional[str] = None
    departure_gate: Optional[str] = None
    arrival_gate: Optional[str] = None
    status: Optional[str] = "scheduled"
    delay_minutes: Optional[int] = 0
    aircraft_code: Optional[str] = None
    airline_name: Optional[str] = None
    checkin_url: Optional[str] = None
    amadeus_offer_id: Optional[str] = None


class UpdateFlightRequest(BaseModel):
    status: Optional[str] = None
    estimated_departure: Optional[str] = None
    estimated_arrival: Optional[str] = None
    departure_gate: Optional[str] = None
    arrival_gate: Optional[str] = None
    departure_terminal: Optional[str] = None
    arrival_terminal: Optional[str] = None
    delay_minutes: Optional[int] = None


@router.post("/bookings/{booking_id}/flights")
async def add_flight_to_booking(
    booking_id: str,
    request: CreateFlightRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a flight to a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    flight_id = create_flight(
        booking_id=booking_id,
        carrier_code=request.carrier_code,
        flight_number=request.flight_number,
        departure_date=request.departure_date,
        departure_airport=request.departure_airport,
        arrival_airport=request.arrival_airport,
        scheduled_departure=request.scheduled_departure,
        scheduled_arrival=request.scheduled_arrival,
        flight_type=request.flight_type,
        estimated_departure=request.estimated_departure,
        estimated_arrival=request.estimated_arrival,
        departure_terminal=request.departure_terminal,
        arrival_terminal=request.arrival_terminal,
        departure_gate=request.departure_gate,
        arrival_gate=request.arrival_gate,
        status=request.status,
        delay_minutes=request.delay_minutes,
        aircraft_code=request.aircraft_code,
        airline_name=request.airline_name,
        checkin_url=request.checkin_url,
        amadeus_offer_id=request.amadeus_offer_id
    )
    
    if not flight_id:
        raise HTTPException(status_code=500, detail="Failed to create flight")
    
    return get_flight_by_id(flight_id)


@router.get("/bookings/{booking_id}/flights")
async def get_booking_flights(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all flights for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    flights = get_flights_by_booking(booking_id)
    return {"flights": flights, "total": len(flights)}


@router.get("/flights/{flight_id}")
async def get_flight(
    flight_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get flight by ID"""
    flight = get_flight_by_id(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Check authorization via booking
    booking = get_booking_by_id(flight['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return flight


@router.put("/flights/{flight_id}")
async def update_flight_endpoint(
    flight_id: str,
    request: UpdateFlightRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update flight"""
    flight = get_flight_by_id(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Check authorization
    booking = get_booking_by_id(flight['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = request.dict(exclude_unset=True)
    if update_flight(flight_id, **update_data):
        return get_flight_by_id(flight_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update flight")


@router.delete("/flights/{flight_id}")
async def delete_flight_endpoint(
    flight_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete flight"""
    flight = get_flight_by_id(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Check authorization
    booking = get_booking_by_id(flight['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if delete_flight(flight_id):
        return {"success": True, "message": "Flight deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete flight")


@router.post("/flights/{flight_id}/refresh")
async def refresh_flight_status(
    flight_id: str,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client),
    current_user: dict = Depends(get_current_user)
):
    """Refresh flight status from Amadeus"""
    if not client:
        raise HTTPException(status_code=503, detail="Amadeus API not configured")
    
    flight = get_flight_by_id(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Check authorization
    booking = get_booking_by_id(flight['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get flight status from Amadeus
        status_data = client.get_flight_status(
            carrier_code=flight['carrier_code'],
            flight_number=flight['flight_number'],
            scheduled_departure_date=flight['departure_date']
        )
        
        # Update flight with new status
        # TODO: Parse Amadeus response and update flight fields
        update_flight(flight_id, last_status_check=datetime.now().isoformat())
        
        return {
            "success": True,
            "flight_id": flight_id,
            "status_data": status_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

