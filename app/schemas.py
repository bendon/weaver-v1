"""
Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time


# Note: Enums are defined in models.py and imported when needed


# Request Schemas
class TravelerContactSchema(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    preferred_channel: str = "email"


class TravelerSchema(BaseModel):
    id: str
    first_name: str
    last_name: str
    date_of_birth: date
    passport_number: str
    passport_expiry: date
    nationality: str
    contact: Optional[TravelerContactSchema] = None


class AirportSchema(BaseModel):
    iata_code: str
    name: str
    city: str
    country: str
    terminal: Optional[str] = None


class FlightSegmentSchema(BaseModel):
    segment_id: str
    carrier_code: str
    carrier_name: str
    flight_number: str
    aircraft_type: Optional[str] = None
    departure_airport: AirportSchema
    departure_datetime: datetime
    arrival_airport: AirportSchema
    arrival_datetime: datetime
    duration: Optional[str] = None
    cabin_class: str = "ECONOMY"
    status: str = "confirmed"


class FlightBookingSchema(BaseModel):
    booking_id: str
    pnr: str
    segments: List[FlightSegmentSchema]
    travelers: List[str]
    total_price: float
    currency: str = "USD"
    booking_date: Optional[datetime] = None
    source_gds: str = "AMADEUS"


class HotelPropertySchema(BaseModel):
    hotel_id: str
    name: str
    chain_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    star_rating: Optional[int] = None
    amenities: List[str] = []


class HotelReservationSchema(BaseModel):
    booking_id: str
    confirmation_number: str
    hotel: HotelPropertySchema
    check_in_date: date
    check_out_date: date
    room_type: str
    room_count: int = 1
    guests: List[str]
    total_price: float
    currency: str = "USD"
    meal_plan: Optional[str] = None
    special_requests: List[str] = []
    status: str = "confirmed"


class TransferSchema(BaseModel):
    booking_id: str
    confirmation_number: Optional[str] = None
    transfer_type: str = "private"
    pickup_location: str
    pickup_datetime: datetime
    pickup_address: Optional[str] = None
    dropoff_location: str
    dropoff_address: Optional[str] = None
    vehicle_type: Optional[str] = None
    provider_name: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    passengers: List[str]
    total_price: Optional[float] = None
    currency: str = "USD"
    status: str = "confirmed"


class ActivitySchema(BaseModel):
    booking_id: str
    confirmation_number: Optional[str] = None
    name: str
    description: Optional[str] = None
    activity_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    meeting_point: Optional[str] = None
    provider_name: Optional[str] = None
    provider_phone: Optional[str] = None
    participants: List[str]
    total_price: Optional[float] = None
    currency: str = "USD"
    inclusions: List[str] = []
    what_to_bring: List[str] = []
    status: str = "confirmed"


class ItineraryBrandingSchema(BaseModel):
    company_name: str
    primary_color: str = "#1E88E5"
    secondary_color: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    website: Optional[str] = None
    footer_text: Optional[str] = None


class CompileItineraryRequest(BaseModel):
    reference_number: str
    title: str
    description: Optional[str] = None
    travelers: List[TravelerSchema] = []
    flights: List[FlightBookingSchema] = []
    hotels: List[HotelReservationSchema] = []
    transfers: List[TransferSchema] = []
    activities: List[ActivitySchema] = []
    branding: Optional[ItineraryBrandingSchema] = None


class FlightSearchRequest(BaseModel):
    origin: str = Field(..., description="Origin airport IATA code (e.g., 'NBO')")
    destination: str = Field(..., description="Destination airport IATA code (e.g., 'MBA')")
    departure_date: str = Field(..., description="Departure date in YYYY-MM-DD format")
    return_date: Optional[str] = Field(None, description="Return date in YYYY-MM-DD format (optional)")
    adults: int = Field(1, ge=1, le=9, description="Number of adult passengers")
    children: int = Field(0, ge=0, le=9, description="Number of children")
    infants: int = Field(0, ge=0, le=9, description="Number of infants")
    max_results: int = Field(5, ge=1, le=250, description="Maximum number of results")


# Response Schemas
class ItineraryResponse(BaseModel):
    itinerary_id: str
    reference_number: str
    title: str
    description: Optional[str] = None
    travelers: List[Dict[str, Any]] = []
    flights: List[Dict[str, Any]] = []
    hotels: List[Dict[str, Any]] = []
    transfers: List[Dict[str, Any]] = []
    activities: List[Dict[str, Any]] = []
    days: List[Dict[str, Any]] = []
    duration_nights: int = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    last_change_hash: str = ""
    branding: Optional[Dict[str, Any]] = None


class FormatResponse(BaseModel):
    content: str
    format: str


class FlightSearchResponse(BaseModel):
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    meta: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    amadeus_connected: bool


class ConvertAmadeusOfferRequest(BaseModel):
    """Request to convert an Amadeus flight offer to a FlightBooking"""
    offer: Dict[str, Any] = Field(..., description="Amadeus flight offer from search results")
    booking_id: str = Field(..., description="Unique booking ID")
    pnr: str = Field(..., description="PNR/confirmation number")
    traveler_ids: List[str] = Field(..., description="List of traveler IDs for this booking")
    source_gds: str = Field("AMADEUS", description="Source GDS")


class ConvertAmadeusOfferResponse(BaseModel):
    """Response containing converted FlightBooking"""
    success: bool
    flight_booking: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class AmadeusTravelerDocumentSchema(BaseModel):
    """Traveler document for Amadeus booking"""
    documentType: str = Field(..., description="PASSPORT, ID_CARD, etc.")
    number: str = Field(..., description="Document number")
    expiryDate: str = Field(..., description="Expiry date YYYY-MM-DD")
    issuanceCountry: str = Field(..., description="ISO country code")
    validityCountry: str = Field(..., description="ISO country code")
    nationality: str = Field(..., description="ISO country code")
    holder: bool = Field(True, description="Is document holder")
    birthPlace: Optional[str] = None
    issuanceLocation: Optional[str] = None
    issuanceDate: Optional[str] = None
    
    class Config:
        # Allow snake_case field names to be converted to camelCase
        populate_by_name = True


class AmadeusTravelerSchema(BaseModel):
    """Traveler information for Amadeus booking"""
    id: str = Field(..., description="Traveler ID (1, 2, 3, etc.)")
    dateOfBirth: str = Field(..., description="Date of birth YYYY-MM-DD")
    name: Dict[str, str] = Field(..., description="firstName and lastName")
    gender: str = Field(..., description="MALE or FEMALE")
    contact: Optional[Dict[str, Any]] = None
    documents: List[AmadeusTravelerDocumentSchema] = Field(..., description="Travel documents")
    
    class Config:
        populate_by_name = True


class CreateAmadeusBookingRequest(BaseModel):
    """Request to create an Amadeus flight booking"""
    flight_offer: Dict[str, Any] = Field(..., description="Flight offer (should be priced first)")
    travelers: List[AmadeusTravelerSchema] = Field(..., description="Traveler details with documents")
    contacts: Optional[List[Dict[str, Any]]] = None
    remarks: Optional[Dict[str, Any]] = None
    ticketing_agreement: Optional[Dict[str, Any]] = None


class AmadeusBookingResponse(BaseModel):
    """Response from Amadeus booking operations"""
    success: bool
    order_id: Optional[str] = None
    pnr: Optional[str] = None
    booking_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class PriceFlightOfferRequest(BaseModel):
    """Request to price a flight offer"""
    flight_offer: Dict[str, Any] = Field(..., description="Flight offer from search results")


class PriceFlightOfferResponse(BaseModel):
    """Response with priced flight offer"""
    success: bool
    priced_offer: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class CreateBookingRequest(BaseModel):
    """Request to create a booking"""
    traveler_id: str
    title: str
    start_date: str
    end_date: str


class ParsePNRRequest(BaseModel):
    """Request to parse PNR text"""
    pnr_text: str


class CreateTravelerRequest(BaseModel):
    """Request to create a traveler"""
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    phone_country_code: Optional[str] = None