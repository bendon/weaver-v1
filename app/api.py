"""
FastAPI REST API for ItineraryWeaver
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.schemas import (
    CompileItineraryRequest,
    ItineraryResponse,
    FormatResponse,
    FlightSearchRequest,
    FlightSearchResponse,
    HealthResponse,
    ConvertAmadeusOfferRequest,
    ConvertAmadeusOfferResponse,
    CreateAmadeusBookingRequest,
    AmadeusBookingResponse,
    PriceFlightOfferRequest,
    PriceFlightOfferResponse,
    CreateBookingRequest,
    ParsePNRRequest,
    CreateTravelerRequest
)
from app.models import (
    Traveler, TravelerContact, NotificationChannel,
    FlightBooking, FlightSegment, Airport, BookingStatus,
    HotelReservation, HotelProperty,
    Transfer, TransferType,
    Activity,
    ItineraryBranding
)
from app.itinerary_compiler import ItineraryCompiler, ItineraryFormatter
from app.amadeus_client import AmadeusClient
from app.amadeus_converter import convert_amadeus_flight_offer
from app.database import (
    init_database,
    save_itinerary,
    get_itinerary as db_get_itinerary,
    get_all_itineraries as db_get_all_itineraries,
    delete_itinerary as db_delete_itinerary,
    save_amadeus_booking,
    get_amadeus_booking_by_order_id,
    get_amadeus_booking_by_pnr,
    update_amadeus_booking_status,
    create_booking, get_booking_by_id, get_booking_by_code,
    get_bookings_by_organization, create_traveler, get_traveler_by_id,
    create_flight, get_flights_by_booking, create_notification,
    get_user_by_email
)
from app.pnr_parser import PNRParser
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.notification_service import NotificationService
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ItineraryWeaver API",
    description="REST API for compiling and formatting travel itineraries",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database is initialized on startup


# Dependency: Get Amadeus client
def get_amadeus_client() -> Optional[AmadeusClient]:
    """Get Amadeus client instance"""
    api_key = os.getenv("AMADEUS_API_KEY")
    api_secret = os.getenv("AMADEUS_API_SECRET")
    environment = os.getenv("AMADEUS_ENVIRONMENT", "test")
    
    if not api_key or not api_secret:
        return None
    
    return AmadeusClient(
        api_key=api_key,
        api_secret=api_secret,
        environment=environment
    )


# Helper: Convert Pydantic schemas to model instances
def convert_traveler(schema) -> Traveler:
    """Convert TravelerSchema to Traveler model"""
    contact = None
    if schema.contact:
        contact = TravelerContact(
            email=schema.contact.email,
            phone=schema.contact.phone,
            whatsapp=schema.contact.whatsapp,
            preferred_channel=NotificationChannel(schema.contact.preferred_channel)
        )
    return Traveler(
        id=schema.id,
        first_name=schema.first_name,
        last_name=schema.last_name,
        date_of_birth=schema.date_of_birth,
        passport_number=schema.passport_number,
        passport_expiry=schema.passport_expiry,
        nationality=schema.nationality,
        contact=contact or TravelerContact()
    )


def convert_flight_booking(schema) -> FlightBooking:
    """Convert FlightBookingSchema to FlightBooking model"""
    segments = []
    for seg_schema in schema.segments:
        segment = FlightSegment(
            segment_id=seg_schema.segment_id,
            carrier_code=seg_schema.carrier_code,
            carrier_name=seg_schema.carrier_name,
            flight_number=seg_schema.flight_number,
            aircraft_type=seg_schema.aircraft_type,
            departure_airport=Airport(
                iata_code=seg_schema.departure_airport.iata_code,
                name=seg_schema.departure_airport.name,
                city=seg_schema.departure_airport.city,
                country=seg_schema.departure_airport.country,
                terminal=seg_schema.departure_airport.terminal
            ),
            departure_datetime=seg_schema.departure_datetime,
            arrival_airport=Airport(
                iata_code=seg_schema.arrival_airport.iata_code,
                name=seg_schema.arrival_airport.name,
                city=seg_schema.arrival_airport.city,
                country=seg_schema.arrival_airport.country,
                terminal=seg_schema.arrival_airport.terminal
            ),
            arrival_datetime=seg_schema.arrival_datetime,
            duration=seg_schema.duration,
            cabin_class=seg_schema.cabin_class,
            status=BookingStatus(seg_schema.status)
        )
        segments.append(segment)
    
    return FlightBooking(
        booking_id=schema.booking_id,
        pnr=schema.pnr,
        segments=segments,
        travelers=schema.travelers,
        total_price=schema.total_price,
        currency=schema.currency,
        booking_date=schema.booking_date,
        source_gds=schema.source_gds
    )


def convert_hotel_reservation(schema) -> HotelReservation:
    """Convert HotelReservationSchema to HotelReservation model"""
    hotel = HotelProperty(
        hotel_id=schema.hotel.hotel_id,
        name=schema.hotel.name,
        chain_name=schema.hotel.chain_name,
        address=schema.hotel.address,
        city=schema.hotel.city,
        country=schema.hotel.country,
        phone=schema.hotel.phone,
        email=schema.hotel.email,
        star_rating=schema.hotel.star_rating,
        amenities=schema.hotel.amenities
    )
    
    return HotelReservation(
        booking_id=schema.booking_id,
        confirmation_number=schema.confirmation_number,
        hotel=hotel,
        check_in_date=schema.check_in_date,
        check_out_date=schema.check_out_date,
        room_type=schema.room_type,
        room_count=schema.room_count,
        guests=schema.guests,
        total_price=schema.total_price,
        currency=schema.currency,
        meal_plan=schema.meal_plan,
        special_requests=schema.special_requests,
        status=BookingStatus(schema.status)
    )


def convert_transfer(schema) -> Transfer:
    """Convert TransferSchema to Transfer model"""
    return Transfer(
        booking_id=schema.booking_id,
        confirmation_number=schema.confirmation_number,
        transfer_type=TransferType(schema.transfer_type),
        pickup_location=schema.pickup_location,
        pickup_datetime=schema.pickup_datetime,
        pickup_address=schema.pickup_address,
        dropoff_location=schema.dropoff_location,
        dropoff_address=schema.dropoff_address,
        vehicle_type=schema.vehicle_type,
        provider_name=schema.provider_name,
        driver_name=schema.driver_name,
        driver_phone=schema.driver_phone,
        passengers=schema.passengers,
        total_price=schema.total_price,
        currency=schema.currency,
        status=BookingStatus(schema.status)
    )


def convert_activity(schema) -> Activity:
    """Convert ActivitySchema to Activity model"""
    return Activity(
        booking_id=schema.booking_id,
        confirmation_number=schema.confirmation_number,
        name=schema.name,
        description=schema.description,
        activity_date=schema.activity_date,
        start_time=schema.start_time,
        end_time=schema.end_time,
        duration=schema.duration,
        location=schema.location,
        meeting_point=schema.meeting_point,
        provider_name=schema.provider_name,
        provider_phone=schema.provider_phone,
        participants=schema.participants,
        total_price=schema.total_price,
        currency=schema.currency,
        inclusions=schema.inclusions,
        what_to_bring=schema.what_to_bring,
        status=BookingStatus(schema.status)
    )


def convert_branding(schema) -> ItineraryBranding:
    """Convert ItineraryBrandingSchema to ItineraryBranding model"""
    return ItineraryBranding(
        company_name=schema.company_name,
        primary_color=schema.primary_color,
        secondary_color=schema.secondary_color,
        contact_phone=schema.contact_phone,
        contact_email=schema.contact_email,
        contact_whatsapp=schema.contact_whatsapp,
        website=schema.website,
        footer_text=schema.footer_text
    )


# API Endpoints
@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    amadeus_client = get_amadeus_client()
    amadeus_connected = False
    
    if amadeus_client:
        try:
            amadeus_client._get_token_sync()
            amadeus_connected = True
        except:
            pass
    
    return HealthResponse(
        status="ok",
        version="1.0.0",
        amadeus_connected=amadeus_connected
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return await root()


@app.get("/api/itineraries", response_model=List[ItineraryResponse])
async def get_all_itineraries(current_user: Dict = Depends(get_current_user)):
    """
    Get all stored itineraries
    """
    try:
        # Get all itineraries from database
        itineraries = db_get_all_itineraries()
        return [ItineraryResponse(**itinerary) for itinerary in itineraries]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/itineraries/{itinerary_id}", response_model=ItineraryResponse)
async def get_itinerary(itinerary_id: str, current_user: Dict = Depends(get_current_user)):
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


@app.post("/api/itineraries/compile", response_model=ItineraryResponse)
async def compile_itinerary(request: CompileItineraryRequest, current_user: Dict = Depends(get_current_user)):
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


@app.post("/api/itineraries/{itinerary_id}/format/{format_type}", response_model=FormatResponse)
async def format_itinerary(itinerary_id: str, format_type: str, request: CompileItineraryRequest, current_user: Dict = Depends(get_current_user)):
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


@app.post("/api/flights/search", response_model=FlightSearchResponse)
async def search_flights(request: FlightSearchRequest, client: Optional[AmadeusClient] = Depends(get_amadeus_client)):
    """
    Search for flights using Amadeus API
    """
    if not client:
        return FlightSearchResponse(
            success=False,
            error="Amadeus API credentials not configured"
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
        
        return FlightSearchResponse(
            success=True,
            data=results.get("data"),
            meta=results.get("meta")
        )
    
    except Exception as e:
        return FlightSearchResponse(
            success=False,
            error=str(e)
        )


@app.post("/api/flights/convert-amadeus-offer", response_model=ConvertAmadeusOfferResponse)
async def convert_amadeus_offer(request: ConvertAmadeusOfferRequest):
    """
    Convert an Amadeus flight offer to a FlightBooking that can be used in itineraries
    
    This endpoint takes an Amadeus flight offer (from search results) and converts it
    into the internal FlightBooking format that can be used when compiling itineraries.
    """
    try:
        # Convert Amadeus offer to FlightBooking
        flight_booking = convert_amadeus_flight_offer(
            offer=request.offer,
            booking_id=request.booking_id,
            pnr=request.pnr,
            traveler_ids=request.traveler_ids,
            source_gds=request.source_gds
        )
        
        # Convert to JSON-serializable dict
        from app.itinerary_compiler import ItineraryFormatter
        booking_dict = ItineraryFormatter.to_json(flight_booking)
        
        return ConvertAmadeusOfferResponse(
            success=True,
            flight_booking=booking_dict
        )
    
    except Exception as e:
        return ConvertAmadeusOfferResponse(
            success=False,
            error=str(e)
        )


@app.post("/api/flights/price-offer", response_model=PriceFlightOfferResponse)
async def price_flight_offer(
    request: PriceFlightOfferRequest,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Get confirmed price for a flight offer before booking
    
    This endpoint prices a flight offer to get the final price and ensure
    availability before creating a booking.
    """
    if not client:
        return PriceFlightOfferResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        result = client.price_flight_offer(request.flight_offer)
        
        # Extract priced offer from response
        priced_offer = result.get("data", {}).get("flightOffers", [])
        if priced_offer:
            return PriceFlightOfferResponse(
                success=True,
                priced_offer=priced_offer[0]
            )
        else:
            return PriceFlightOfferResponse(
                success=False,
                error="No priced offer returned"
            )
    
    except Exception as e:
        return PriceFlightOfferResponse(
            success=False,
            error=str(e)
        )


@app.post("/api/flights/create-booking", response_model=AmadeusBookingResponse)
async def create_amadeus_booking(
    request: CreateAmadeusBookingRequest,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Create a flight booking with Amadeus
    
    This endpoint creates an actual booking in Amadeus and returns the
    order ID and PNR. The flight offer should be priced first using /api/flights/price-offer.
    """
    if not client:
        return AmadeusBookingResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        # Convert travelers to Amadeus format
        travelers_data = []
        for traveler in request.travelers:
            traveler_dict = {
                "id": traveler.id,
                "dateOfBirth": traveler.dateOfBirth,
                "name": traveler.name,
                "gender": traveler.gender
            }
            if traveler.contact:
                traveler_dict["contact"] = traveler.contact
            if traveler.documents:
                traveler_dict["documents"] = [doc.dict() for doc in traveler.documents]
            travelers_data.append(traveler_dict)
        
        # Create booking
        result = client.create_booking(
            flight_offer=request.flight_offer,
            travelers=travelers_data,
            contacts=request.contacts,
            remarks=request.remarks,
            ticketing_agreement=request.ticketing_agreement
        )
        
        # Extract order ID and PNR
        booking_data = result.get("data", {})
        order_id = booking_data.get("id")
        associated_records = booking_data.get("associatedRecords", [])
        pnr = None
        if associated_records:
            pnr = associated_records[0].get("reference")
        
        # Save booking reference to database
        if order_id:
            booking_id = f"AMADEUS-{order_id}"
            save_amadeus_booking(
                booking_id=booking_id,
                amadeus_order_id=order_id,
                pnr=pnr,
                itinerary_id=None,  # Can be linked later
                flight_booking_id=None,  # Can be linked later
                booking_data=booking_data,
                status="confirmed"
            )
        
        return AmadeusBookingResponse(
            success=True,
            order_id=order_id,
            pnr=pnr,
            booking_data=booking_data
        )
    
    except Exception as e:
        return AmadeusBookingResponse(
            success=False,
            error=str(e)
        )


@app.get("/api/flights/booking/{order_id}", response_model=AmadeusBookingResponse)
async def get_amadeus_booking(
    order_id: str,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Get flight booking details by Amadeus order ID
    """
    if not client:
        return AmadeusBookingResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        result = client.get_booking(order_id)
        booking_data = result.get("data", {})
        
        # Extract PNR if available
        associated_records = booking_data.get("associatedRecords", [])
        pnr = None
        if associated_records:
            pnr = associated_records[0].get("reference")
        
        return AmadeusBookingResponse(
            success=True,
            order_id=order_id,
            pnr=pnr,
            booking_data=booking_data
        )
    
    except Exception as e:
        return AmadeusBookingResponse(
            success=False,
            error=str(e)
        )


@app.get("/api/flights/booking/pnr/{pnr}", response_model=AmadeusBookingResponse)
async def get_amadeus_booking_by_pnr(
    pnr: str,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Get flight booking by PNR/confirmation number
    """
    if not client:
        return AmadeusBookingResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        # First check our database
        db_booking = get_amadeus_booking_by_pnr(pnr)
        if db_booking and db_booking.get("amadeus_order_id"):
            # Fetch latest from Amadeus
            result = client.get_booking(db_booking["amadeus_order_id"])
            booking_data = result.get("data", {})
            
            # Update our database with latest data
            save_amadeus_booking(
                booking_id=db_booking["booking_id"],
                amadeus_order_id=db_booking["amadeus_order_id"],
                pnr=pnr,
                itinerary_id=db_booking.get("itinerary_id"),
                flight_booking_id=db_booking.get("flight_booking_id"),
                booking_data=booking_data,
                status=db_booking.get("status", "confirmed")
            )
            
            return AmadeusBookingResponse(
                success=True,
                order_id=db_booking["amadeus_order_id"],
                pnr=pnr,
                booking_data=booking_data
            )
        else:
            return AmadeusBookingResponse(
                success=False,
                error=f"Booking with PNR {pnr} not found"
            )
    
    except Exception as e:
        return AmadeusBookingResponse(
            success=False,
            error=str(e)
        )


@app.delete("/api/flights/booking/{order_id}", response_model=AmadeusBookingResponse)
async def cancel_amadeus_booking(
    order_id: str,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Cancel a flight booking by Amadeus order ID
    """
    if not client:
        return AmadeusBookingResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        result = client.delete_booking(order_id)
        booking_data = result.get("data", {})
        
        # Update booking status in database
        update_amadeus_booking_status(order_id, "cancelled")
        
        return AmadeusBookingResponse(
            success=True,
            order_id=order_id,
            booking_data=booking_data
        )
    
    except Exception as e:
        return AmadeusBookingResponse(
            success=False,
            error=str(e)
        )


@app.post("/api/flights/booking/{order_id}/sync", response_model=AmadeusBookingResponse)
async def sync_amadeus_booking(
    order_id: str,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Sync booking status from Amadeus (refresh booking data)
    """
    if not client:
        return AmadeusBookingResponse(
            success=False,
            error="Amadeus API credentials not configured"
        )
    
    try:
        # Get latest from Amadeus
        result = client.get_booking(order_id)
        booking_data = result.get("data", {})
        
        # Update our database
        db_booking = get_amadeus_booking_by_order_id(order_id)
        if db_booking:
            # Determine status from booking data
            status = "confirmed"
            if booking_data.get("type") == "flight-order":
                # Check if cancelled
                if "cancelled" in str(booking_data).lower():
                    status = "cancelled"
            
            save_amadeus_booking(
                booking_id=db_booking["booking_id"],
                amadeus_order_id=order_id,
                pnr=db_booking.get("pnr"),
                itinerary_id=db_booking.get("itinerary_id"),
                flight_booking_id=db_booking.get("flight_booking_id"),
                booking_data=booking_data,
                status=status
            )
        
        # Extract PNR
        associated_records = booking_data.get("associatedRecords", [])
        pnr = None
        if associated_records:
            pnr = associated_records[0].get("reference")
        
        return AmadeusBookingResponse(
            success=True,
            order_id=order_id,
            pnr=pnr,
            booking_data=booking_data
        )
    
    except Exception as e:
        return AmadeusBookingResponse(
            success=False,
            error=str(e)
        )


@app.delete("/api/itineraries/{itinerary_id}")
async def delete_itinerary(itinerary_id: str, current_user: Dict = Depends(get_current_user)):
    """
    Delete an itinerary by ID
    """
    try:
        # Check if itinerary exists
        existing = db_get_itinerary(itinerary_id)
        if not existing:
            raise HTTPException(status_code=404, detail=f"Itinerary {itinerary_id} not found")
        
        # Delete from database
        if db_delete_itinerary(itinerary_id):
            return {"success": True, "message": f"Itinerary {itinerary_id} deleted"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete itinerary")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/amadeus/test")
async def test_amadeus(client: Optional[AmadeusClient] = Depends(get_amadeus_client)):
    """
    Test Amadeus API connection
    """
    if not client:
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Amadeus API credentials not configured"}
        )
    
    try:
        token = client._get_token_sync()
        return {
            "success": True,
            "message": "Amadeus API connection successful",
            "token_preview": token[:20] + "..."
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


# Authentication request schemas

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    organization_name: str


# Authentication endpoints
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Login endpoint"""
    user = get_user_by_email(request.email)
    if not user or not verify_password(request.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('is_active'):
        raise HTTPException(status_code=403, detail="User account is inactive")
    
    # Update last login
    from app.database import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user['id'],))
    conn.commit()
    conn.close()
    
    # Create token
    token = create_access_token({"sub": user['id'], "email": user['email'], "role": user['role']})
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "role": user['role'],
            "organization_id": user['organization_id']
        }
    }


@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register new organization and user"""
    from app.database import create_organization, create_user
    
    # Check if user exists
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create organization
    org_slug = request.organization_name.lower().replace(' ', '-')[:50]
    org_id = create_organization(name=request.organization_name, slug=org_slug)
    
    if not org_id:
        raise HTTPException(status_code=500, detail="Failed to create organization")
    
    # Create user
    password_hash = hash_password(request.password)
    user_id = create_user(
        email=request.email,
        password_hash=password_hash,
        name=request.name,
        organization_id=org_id,
        role="admin"
    )
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Return token
    token = create_access_token({"sub": user_id, "email": request.email, "role": "admin"})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": request.email,
            "name": request.name,
            "role": "admin",
            "organization_id": org_id
        }
    }


# Traveler endpoints
@app.post("/api/travelers")
async def create_traveler_endpoint(
    request: CreateTravelerRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new traveler"""
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating traveler: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create traveler: {str(e)}")


# Booking endpoints
@app.post("/api/bookings")
async def create_booking_endpoint(
    request: CreateBookingRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new booking"""
    booking_id = create_booking(
        organization_id=current_user['organization_id'],
        created_by=current_user['id'],
        traveler_id=request.traveler_id,
        title=request.title,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    if not booking_id:
        raise HTTPException(status_code=500, detail="Failed to create booking")
    
    booking = get_booking_by_id(booking_id)
    return booking


@app.get("/api/bookings")
async def get_bookings(
    status: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """Get all bookings for organization"""
    bookings = get_bookings_by_organization(
        current_user['organization_id'],
        status=status
    )
    return {"bookings": bookings, "total": len(bookings)}


@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: Dict = Depends(get_current_user)):
    """Get booking by ID"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if booking['organization_id'] != current_user['organization_id']:
        if current_user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get related data
    flights = get_flights_by_booking(booking_id)
    booking['flights'] = flights
    
    return booking


# PNR parsing endpoint
@app.post("/api/bookings/{booking_id}/flights/parse-pnr")
async def parse_pnr(
    booking_id: str,
    request: ParsePNRRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Parse PNR text and extract flights/travelers"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Parse PNR
    parsed = PNRParser.parse_pnr(request.pnr_text)
    
    # Enrich flights with Amadeus data
    amadeus_client = get_amadeus_client()
    enriched_flights = []
    
    if amadeus_client:
        for flight in parsed['flights']:
            try:
                # Get flight status from Amadeus
                status_data = amadeus_client.get_flight_status(
                    carrier_code=flight['carrier_code'],
                    flight_number=flight['flight_number'],
                    scheduled_departure_date=flight['departure_date']
                )
                
                # Extract airport info
                dep_airport = amadeus_client.get_airport_info(flight['departure_airport'])
                arr_airport = amadeus_client.get_airport_info(flight['arrival_airport'])
                
                # Get airline info
                airline_info = amadeus_client.get_airline_info(flight['carrier_code'])
                
                flight['airport_info'] = {
                    'departure': dep_airport.get('data', [{}])[0] if dep_airport else {},
                    'arrival': arr_airport.get('data', [{}])[0] if arr_airport else {}
                }
                flight['airline_info'] = airline_info.get('data', [{}])[0] if airline_info else {}
                
            except Exception as e:
                print(f"Error enriching flight: {e}")
            
            enriched_flights.append(flight)
    
    return {
        "travelers": parsed['travelers'],
        "flights": enriched_flights,
        "contact": parsed.get('contact')
    }


# Flight status endpoint
@app.get("/api/bookings/{booking_id}/flights/{flight_id}/status")
async def get_flight_status(
    booking_id: str,
    flight_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get current flight status from Amadeus"""
    amadeus_client = get_amadeus_client()
    if not amadeus_client:
        raise HTTPException(status_code=503, detail="Amadeus API not configured")
    
    from app.database import get_flights_by_booking
    flights = get_flights_by_booking(booking_id)
    flight = next((f for f in flights if f['id'] == flight_id), None)
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    try:
        status_data = amadeus_client.get_flight_status(
            carrier_code=flight['carrier_code'],
            flight_number=flight['flight_number'],
            scheduled_departure_date=flight['departure_date']
        )
        return status_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Public itinerary endpoint (no auth required)
@app.get("/api/public/itinerary/{booking_code}")
async def get_public_itinerary(booking_code: str):
    """Get itinerary by booking code (public, no auth required)"""
    booking = get_booking_by_code(booking_code)
    if not booking:
        raise HTTPException(status_code=404, detail="Itinerary not found")
    
    # Get itinerary data
    from app.database import get_traveler_by_id
    
    traveler = get_traveler_by_id(booking['traveler_id'])
    flights = get_flights_by_booking(booking['id'])
    
    # Compile itinerary
    # Note: This is simplified - you'd want to get hotels, transfers, activities too
    itinerary_data = {
        "booking_id": booking['id'],
        "booking_code": booking['booking_code'],
        "title": booking['title'],
        "start_date": booking['start_date'],
        "end_date": booking['end_date'],
        "traveler": {
            "name": f"{traveler['first_name']} {traveler['last_name']}" if traveler else "Traveler"
        },
        "flights": flights
    }
    
    return itinerary_data


@app.on_event("startup")
async def startup_event():
    """
    Initialize database and demo itinerary on startup
    """
    try:
        # Initialize database
        init_database()
        print("Database initialized")
        
        # Check if demo itinerary already exists
        demo_id = "ITIN-SDK-2025-0042"
        existing = db_get_itinerary(demo_id)
        if existing:
            print(f"Demo itinerary already exists: {demo_id}")
            return
        
        # Import demo data creation function
        from app.demo import create_sample_booking
        
        # Create sample booking data
        travelers, flights, hotels, transfers, activities = create_sample_booking()
        
        # Create branding
        branding = ItineraryBranding(
            company_name="Safari Dreams Kenya",
            primary_color="#2E7D32",
            secondary_color="#FFF8E1",
            contact_phone="+254 722 555 123",
            contact_email="info@safaridreams.ke",
            contact_whatsapp="+254 722 555 123",
            website="www.safaridreams.ke",
            footer_text="Creating unforgettable African adventures since 2010"
        )
        
        # Compile demo itinerary
        compiler = ItineraryCompiler(branding=branding)
        itinerary = compiler.compile(
            reference_number="SDK-2025-0042",
            title="Kenya Safari Adventure",
            description="A luxurious 4-night safari experience in the Masai Mara",
            travelers=travelers,
            flights=flights,
            hotels=hotels,
            transfers=transfers,
            activities=activities
        )
        
        # Store demo itinerary in database
        itinerary_dict = ItineraryFormatter.to_json(itinerary)
        if save_itinerary(itinerary_dict):
            print(f"Demo itinerary initialized: {itinerary.itinerary_id}")
        else:
            print(f"Warning: Failed to save demo itinerary")
    except Exception as e:
        print(f"Warning: Could not initialize demo itinerary: {e}")

