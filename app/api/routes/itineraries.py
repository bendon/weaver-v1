"""
Itineraries routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict
from app.core.security import get_current_user
from app.database import (
    get_all_itineraries as db_get_all_itineraries,
    get_itinerary as db_get_itinerary,
    delete_itinerary as db_delete_itinerary,
    save_itinerary
)
from app.itinerary_compiler import ItineraryCompiler, ItineraryFormatter
from app.schemas import ItineraryResponse, CompileItineraryRequest, FormatResponse

router = APIRouter()


def convert_traveler(t):
    """Convert traveler schema to model"""
    from app.models import Traveler, TravelerContact
    contact = TravelerContact(**t.get('contact', {})) if t.get('contact') else None
    return Traveler(
        first_name=t['first_name'],
        last_name=t['last_name'],
        contact=contact
    )


def convert_flight_booking(f):
    """Convert flight schema to model"""
    from app.models import FlightBooking, FlightSegment, Airport
    segments = [
        FlightSegment(
            departure_airport=Airport(**s['departure_airport']),
            arrival_airport=Airport(**s['arrival_airport']),
            departure_time=s['departure_time'],
            arrival_time=s['arrival_time'],
            flight_number=s['flight_number'],
            carrier_code=s['carrier_code']
        ) for s in f.get('segments', [])
    ]
    return FlightBooking(segments=segments)


def convert_hotel_reservation(h):
    """Convert hotel schema to model"""
    from app.models import HotelReservation, HotelProperty
    property_data = h.get('property', {})
    property_obj = HotelProperty(
        name=property_data.get('name', ''),
        address=property_data.get('address', ''),
        city=property_data.get('city', ''),
        country=property_data.get('country', '')
    )
    return HotelReservation(
        property=property_obj,
        check_in=h['check_in'],
        check_out=h['check_out'],
        room_type=h.get('room_type')
    )


def convert_transfer(t):
    """Convert transfer schema to model"""
    from app.models import Transfer, TransferType
    return Transfer(
        type=TransferType(t.get('type', 'other')),
        from_location=t['from_location'],
        to_location=t['to_location'],
        scheduled_time=t['scheduled_time']
    )


def convert_activity(a):
    """Convert activity schema to model"""
    from app.models import Activity
    return Activity(
        name=a['name'],
        scheduled_time=a['scheduled_time'],
        location=a.get('location', ''),
        description=a.get('description', '')
    )


def convert_branding(b):
    """Convert branding schema to model"""
    from app.models import ItineraryBranding
    return ItineraryBranding(
        company_name=b.get('company_name', ''),
        logo_url=b.get('logo_url'),
        primary_color=b.get('primary_color', '#000000'),
        secondary_color=b.get('secondary_color', '#666666')
    )


@router.get("", response_model=List[ItineraryResponse])
async def get_all_itineraries(current_user: dict = Depends(get_current_user)):
    """
    Get all stored itineraries
    """
    try:
        # Get all itineraries from database
        itineraries = db_get_all_itineraries()
        return [ItineraryResponse(**itinerary) for itinerary in itineraries]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{itinerary_id}", response_model=ItineraryResponse)
async def get_itinerary(itinerary_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get a specific itinerary by ID
    """
    try:
        itinerary_dict = db_get_itinerary(itinerary_id)
        if not itinerary_dict:
            raise HTTPException(status_code=404, detail=f"Itinerary {itinerary_id} not found")
        return ItineraryResponse(**itinerary_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compile", response_model=ItineraryResponse)
async def compile_itinerary(
    request: CompileItineraryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Compile travel components into a structured itinerary and store it
    """
    try:
        # Convert schemas to models
        travelers = [convert_traveler(t) for t in request.travelers]
        flights = [convert_flight_booking(f) for f in request.flights]
        hotels = [convert_hotel_reservation(h) for h in request.hotels]
        transfers = [convert_transfer(t) for t in request.transfers]
        activities = [convert_activity(a) for a in request.activities]
        
        # Create branding
        branding = None
        if request.branding:
            branding = convert_branding(request.branding)
        
        # Compile itinerary
        compiler = ItineraryCompiler(branding=branding)
        itinerary = compiler.compile(
            reference_number=request.reference_number,
            title=request.title,
            description=request.description,
            travelers=travelers,
            flights=flights,
            hotels=hotels,
            transfers=transfers,
            activities=activities
        )
        
        # Convert to JSON-serializable dict
        itinerary_dict = ItineraryFormatter.to_json(itinerary)
        
        # Store the itinerary in database
        if not save_itinerary(itinerary_dict):
            raise HTTPException(status_code=500, detail="Failed to save itinerary")
        
        return ItineraryResponse(**itinerary_dict)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{itinerary_id}/format/{format_type}", response_model=FormatResponse)
async def format_itinerary(
    itinerary_id: str,
    format_type: str,
    request: CompileItineraryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Get itinerary in a specific format (whatsapp, html, json)
    
    format_type: whatsapp, html, or json
    """
    if format_type not in ["whatsapp", "html", "json"]:
        raise HTTPException(status_code=400, detail="Format must be 'whatsapp', 'html', or 'json'")
    
    try:
        # Convert and compile (same as compile endpoint)
        travelers = [convert_traveler(t) for t in request.travelers]
        flights = [convert_flight_booking(f) for f in request.flights]
        hotels = [convert_hotel_reservation(h) for h in request.hotels]
        transfers = [convert_transfer(t) for t in request.transfers]
        activities = [convert_activity(a) for a in request.activities]
        
        branding = None
        if request.branding:
            branding = convert_branding(request.branding)
        
        compiler = ItineraryCompiler(branding=branding)
        itinerary = compiler.compile(
            reference_number=request.reference_number,
            title=request.title,
            description=request.description,
            travelers=travelers,
            flights=flights,
            hotels=hotels,
            transfers=transfers,
            activities=activities
        )
        
        # Generate format
        if format_type == "whatsapp":
            content = ItineraryFormatter.to_whatsapp_message(itinerary)
        elif format_type == "html":
            content = ItineraryFormatter.to_html(itinerary)
        else:  # json
            content = ItineraryFormatter.to_json(itinerary)
            import json
            content = json.dumps(content, indent=2, default=str)
        
        return FormatResponse(content=content, format=format_type)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{itinerary_id}")
async def delete_itinerary(itinerary_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete an itinerary by ID
    """
    try:
        # Check if itinerary exists
        existing = db_get_itinerary(itinerary_id)
        if not existing:
            raise HTTPException(status_code=404, detail=f"Itinerary {itinerary_id} not found")
        
        # Delete the itinerary
        if not db_delete_itinerary(itinerary_id):
            raise HTTPException(status_code=500, detail="Failed to delete itinerary")
        
        return {
            "success": True,
            "message": f"Itinerary {itinerary_id} deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

