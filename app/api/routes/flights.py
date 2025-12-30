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


def _is_iata_code(code: str) -> bool:
    """Check if a string looks like a valid IATA airport code (3 letters, case-insensitive)"""
    return len(code) == 3 and code.isalpha()


def _get_iata_code_from_name(name: str, client: Optional[AmadeusClient] = None) -> Optional[str]:
    """
    Try to find IATA code from a city/airport name
    First searches local database, then falls back to Amadeus API
    Returns the IATA code if found, None otherwise
    """
    # First, try local database
    try:
        from app.core.database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        
        name_lower = name.lower()
        name_upper = name.upper()
        
        # Search by city name or airport name
        cursor.execute("""
            SELECT iata_code
            FROM airports
            WHERE 
                LOWER(city) = ? OR
                LOWER(city) LIKE ? OR
                LOWER(name) LIKE ? OR
                iata_code = ?
            ORDER BY 
                CASE WHEN LOWER(city) = ? THEN 1 ELSE 2 END,
                CASE WHEN LOWER(name) LIKE ? THEN 1 ELSE 2 END
            LIMIT 1
        """, (
            name_lower,  # Exact city match
            f"{name_lower}%",  # City starts with
            f"%{name_lower}%",  # Name contains
            name_upper,  # Exact IATA code
            name_lower,  # For ordering
            f"{name_lower}%",  # For ordering
        ))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return row["iata_code"]
    except Exception as e:
        print(f"Error searching local database for airport: {e}")
    
    # Fall back to Amadeus if available
    if client:
        try:
            # First try searching as airport
            result = client.search_airports(name, sub_type="AIRPORT")
            locations = result.get("data", [])
            
            if locations:
                iata_code = locations[0].get("iataCode")
                if iata_code:
                    return iata_code
            
            # If no airport found, try searching as city
            result = client.search_airports(name, sub_type="CITY")
            locations = result.get("data", [])
            
            if locations:
                iata_code = locations[0].get("iataCode")
                if iata_code:
                    return iata_code
        except Exception:
            pass
    
    return None


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
    
    # Validate and convert origin/destination to IATA codes
    origin_raw = request.origin.strip()
    destination_raw = request.destination.strip()
    
    # Check if origin is already a valid IATA code
    if _is_iata_code(origin_raw):
        origin = origin_raw.upper()
    else:
        # Try to find IATA code from city/airport name
        found_code = _get_iata_code_from_name(origin_raw, client)
        if found_code:
            origin = found_code
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Could not find airport code for origin: {origin_raw}. Please use a 3-letter IATA code (e.g., AMS, NBO) or select from airport suggestions."
            )
    
    # Check if destination is already a valid IATA code
    if _is_iata_code(destination_raw):
        destination = destination_raw.upper()
    else:
        # Try to find IATA code from city/airport name
        found_code = _get_iata_code_from_name(destination_raw, client)
        if found_code:
            destination = found_code
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Could not find airport code for destination: {destination_raw}. Please use a 3-letter IATA code (e.g., AMS, NBO) or select from airport suggestions."
            )
    
    try:
        results = client.search_flights(
            origin=origin,
            destination=destination,
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
