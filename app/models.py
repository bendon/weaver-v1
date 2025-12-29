"""
Data models for ItineraryWeaver PoC
"""

from dataclasses import dataclass, field
from datetime import datetime, date, time
from enum import Enum
from typing import List, Optional, Dict, Any


class NotificationChannel(Enum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    PHONE = "phone"


class BookingStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class TransferType(Enum):
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC = "public"


@dataclass
class TravelerContact:
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    preferred_channel: NotificationChannel = NotificationChannel.EMAIL


@dataclass
class Traveler:
    id: str
    first_name: str
    last_name: str
    date_of_birth: date
    passport_number: str
    passport_expiry: date
    nationality: str
    contact: TravelerContact = field(default_factory=TravelerContact)


@dataclass
class Airport:
    iata_code: str
    name: str
    city: str
    country: str
    terminal: Optional[str] = None


@dataclass
class FlightSegment:
    segment_id: str
    carrier_code: str
    carrier_name: str
    flight_number: str
    aircraft_type: Optional[str] = None
    departure_airport: Airport = None
    departure_datetime: datetime = None
    arrival_airport: Airport = None
    arrival_datetime: datetime = None
    duration: Optional[str] = None
    cabin_class: str = "ECONOMY"
    status: BookingStatus = BookingStatus.CONFIRMED


@dataclass
class FlightBooking:
    booking_id: str
    pnr: str
    segments: List[FlightSegment]
    travelers: List[str]  # Traveler IDs
    total_price: float
    currency: str = "USD"
    booking_date: datetime = field(default_factory=datetime.now)
    source_gds: str = "AMADEUS"  # AMADEUS, SABRE, DIRECT, etc.


@dataclass
class HotelProperty:
    hotel_id: str
    name: str
    chain_name: Optional[str] = None
    address: Optional[str] = None
    city: str = None
    country: str = None
    phone: Optional[str] = None
    email: Optional[str] = None
    star_rating: Optional[int] = None
    amenities: List[str] = field(default_factory=list)


@dataclass
class HotelReservation:
    booking_id: str
    confirmation_number: str
    hotel: HotelProperty
    check_in_date: date
    check_out_date: date
    room_type: str
    room_count: int = 1
    guests: List[str] = field(default_factory=list)  # Traveler IDs
    total_price: float = 0.0
    currency: str = "USD"
    meal_plan: Optional[str] = None  # BB, HB, FB, AI
    special_requests: List[str] = field(default_factory=list)
    status: BookingStatus = BookingStatus.CONFIRMED


@dataclass
class Transfer:
    booking_id: str
    confirmation_number: Optional[str] = None
    transfer_type: TransferType = TransferType.PRIVATE
    pickup_location: str = None
    pickup_datetime: Optional[datetime] = None
    pickup_address: Optional[str] = None
    dropoff_location: str = None
    dropoff_address: Optional[str] = None
    vehicle_type: Optional[str] = None
    provider_name: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    passengers: List[str] = field(default_factory=list)  # Traveler IDs
    total_price: float = 0.0
    currency: str = "USD"
    status: BookingStatus = BookingStatus.CONFIRMED


@dataclass
class Activity:
    booking_id: str
    confirmation_number: Optional[str] = None
    name: str = None
    description: Optional[str] = None
    activity_date: date = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    meeting_point: Optional[str] = None
    provider_name: Optional[str] = None
    provider_phone: Optional[str] = None
    participants: List[str] = field(default_factory=list)  # Traveler IDs
    total_price: float = 0.0
    currency: str = "USD"
    inclusions: List[str] = field(default_factory=list)
    what_to_bring: List[str] = field(default_factory=list)
    status: BookingStatus = BookingStatus.CONFIRMED


@dataclass
class ItineraryBranding:
    company_name: str
    primary_color: str = "#1E88E5"
    secondary_color: str = "#FFFFFF"
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_whatsapp: Optional[str] = None
    website: Optional[str] = None
    footer_text: Optional[str] = None
    logo_url: Optional[str] = None


@dataclass
class ItineraryDay:
    date: date
    day_number: int
    location: str
    activities: List[Activity] = field(default_factory=list)
    transfers: List[Transfer] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


@dataclass
class Itinerary:
    itinerary_id: str
    reference_number: str
    title: str
    description: Optional[str] = None
    travelers: List[Traveler] = field(default_factory=list)
    flights: List[FlightBooking] = field(default_factory=list)
    hotels: List[HotelReservation] = field(default_factory=list)
    transfers: List[Transfer] = field(default_factory=list)
    activities: List[Activity] = field(default_factory=list)
    days: List[ItineraryDay] = field(default_factory=list)
    branding: Optional[ItineraryBranding] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    last_change_hash: str = ""
    duration_nights: int = 0

