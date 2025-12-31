# TravelWeaver 2.0 - Data Models (Pydantic)

**Version**: 2.0
**Date**: 2025-12-31
**Status**: Design Phase

---

## Table of Contents

1. [Model Architecture](#model-architecture)
2. [Base Models](#base-models)
3. [User & Authentication Models](#user--authentication-models)
4. [Traveler Models](#traveler-models)
5. [Flight Models](#flight-models)
6. [Hotel Models](#hotel-models)
7. [Transport Models](#transport-models)
8. [Experience Models](#experience-models)
9. [Booking Models](#booking-models)
10. [Payment Models](#payment-models)
11. [Conversation Models](#conversation-models)
12. [Organization Models](#organization-models)
13. [Validation Rules](#validation-rules)

---

## Model Architecture

### Principles

1. **Type Safety**: All models use strict type hints
2. **Validation**: Pydantic validates all data automatically
3. **Immutability**: Use frozen models where appropriate
4. **Reusability**: Shared models in common module
5. **Documentation**: All fields have descriptions
6. **Serialization**: Models support JSON serialization

### Model Structure

```
app/models/
├── __init__.py
├── base.py                 # Base model classes
├── user.py                 # User and auth models
├── traveler.py             # Traveler models
├── flight.py               # Flight models
├── hotel.py                # Hotel models
├── transport.py            # Transport models
├── experience.py           # Experience models
├── booking.py              # Booking models
├── payment.py              # Payment models
├── conversation.py         # Conversation models
└── organization.py         # Organization models
```

---

## Base Models

**File**: `app/models/base.py`

### Base Classes

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class MongoBaseModel(BaseModel):
    """
    Base model for MongoDB documents

    Provides:
    - ObjectId support
    - Timestamp fields
    - JSON serialization
    """

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class APIBaseModel(BaseModel):
    """
    Base model for API requests/responses

    Provides:
    - Consistent validation
    - Serialization config
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True
    )


class PaginationParams(BaseModel):
    """Pagination query parameters"""

    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Items per page"
    )


class PaginationResponse(BaseModel):
    """Pagination response metadata"""

    current_page: int
    per_page: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool
    next_page: Optional[int] = None
    prev_page: Optional[int] = None


class APIResponse(BaseModel):
    """Standard API response wrapper"""

    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    pagination: Optional[PaginationResponse] = None


class Location(BaseModel):
    """Geographic location"""

    country: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    country_name: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = Field(
        default=None,
        description="Lat/lng coordinates"
    )


class ContactInfo(BaseModel):
    """Contact information"""

    email: Optional[str] = Field(None, pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    website: Optional[str] = None


class DateRange(BaseModel):
    """Date range"""

    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")

    def validate_range(self) -> bool:
        """Validate that end_date is after start_date"""
        from datetime import datetime
        start = datetime.fromisoformat(self.start_date)
        end = datetime.fromisoformat(self.end_date)
        return end > start


class Price(BaseModel):
    """Price information"""

    amount: float = Field(..., ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    @property
    def formatted(self) -> str:
        """Format price as string"""
        return f"{self.currency} {self.amount:.2f}"
```

---

## User & Authentication Models

**File**: `app/models/user.py`

### User Models

```python
from pydantic import Field, EmailStr, field_validator
from typing import Optional, List
from enum import Enum
from app.models.base import MongoBaseModel, APIBaseModel


class UserRole(str, Enum):
    """User role enumeration"""

    DMC_ADMIN = "dmc_admin"
    DMC_MANAGER = "dmc_manager"
    DMC_STAFF = "dmc_staff"
    TRAVELER = "traveler"
    SYSTEM_ADMIN = "system_admin"


class UserStatus(str, Enum):
    """User status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class UserPermission(str, Enum):
    """User permissions"""

    BOOKINGS_READ = "bookings:read"
    BOOKINGS_WRITE = "bookings:write"
    TRAVELERS_READ = "travelers:read"
    TRAVELERS_WRITE = "travelers:write"
    PAYMENTS_READ = "payments:read"
    PAYMENTS_WRITE = "payments:write"
    SETTINGS_READ = "settings:read"
    SETTINGS_WRITE = "settings:write"
    USERS_MANAGE = "users:manage"


class User(MongoBaseModel):
    """User document model"""

    email: EmailStr = Field(..., description="User email address")
    password_hash: str = Field(..., description="Hashed password")
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole
    status: UserStatus = UserStatus.ACTIVE
    organization_id: Optional[str] = None
    permissions: List[UserPermission] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    last_login: Optional[datetime] = None
    email_verified: bool = False
    verification_code: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        """Ensure email is lowercase"""
        return v.lower()


class UserCreate(APIBaseModel):
    """User creation request"""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain special character")
        return v


class UserUpdate(APIBaseModel):
    """User update request"""

    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class UserLogin(APIBaseModel):
    """User login request"""

    email: EmailStr
    password: str


class UserResponse(APIBaseModel):
    """User response (excludes sensitive data)"""

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    status: UserStatus
    organization_id: Optional[str] = None
    permissions: List[UserPermission]
    last_login: Optional[datetime] = None
    created_at: datetime


class TokenResponse(APIBaseModel):
    """Authentication token response"""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    user: UserResponse


class PasswordResetRequest(APIBaseModel):
    """Password reset request"""

    email: EmailStr


class PasswordResetConfirm(APIBaseModel):
    """Password reset confirmation"""

    email: EmailStr
    reset_code: str = Field(..., min_length=6, max_length=10)
    new_password: str = Field(..., min_length=8, max_length=100)
```

---

## Traveler Models

**File**: `app/models/traveler.py`

### Traveler Models

```python
from pydantic import Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date
from app.models.base import MongoBaseModel, APIBaseModel


class PassportInfo(BaseModel):
    """Passport information"""

    number: str = Field(..., min_length=5, max_length=20)
    country: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    issue_date: Optional[date] = None
    expiry_date: date

    @field_validator("expiry_date")
    @classmethod
    def validate_not_expired(cls, v: date) -> date:
        """Ensure passport is not expired"""
        from datetime import date as dt_date
        if v < dt_date.today():
            raise ValueError("Passport is expired")
        return v


class EmergencyContact(BaseModel):
    """Emergency contact information"""

    name: str = Field(..., min_length=1, max_length=100)
    relationship: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[EmailStr] = None


class TravelerPreferences(BaseModel):
    """Traveler preferences"""

    dietary: List[str] = Field(default_factory=list, description="Dietary requirements")
    seat_preference: Optional[str] = Field(None, pattern="^(window|aisle|middle)$")
    room_type: Optional[str] = Field(None, pattern="^(single|double|twin|suite)$")
    special_needs: Optional[str] = None


class TravelHistoryItem(BaseModel):
    """Travel history record"""

    booking_id: str
    booking_code: str
    destination: str
    trip_date: date
    amount_spent: float


class Traveler(MongoBaseModel):
    """Traveler document model"""

    organization_id: str = Field(..., description="DMC organization ID")
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    nationality: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    date_of_birth: Optional[date] = None
    passport: Optional[PassportInfo] = None
    preferences: TravelerPreferences = Field(default_factory=TravelerPreferences)
    emergency_contact: Optional[EmergencyContact] = None
    travel_history: List[TravelHistoryItem] = Field(default_factory=list)
    total_bookings: int = 0
    total_spent: float = 0.0
    notes: Optional[str] = None


class TravelerCreate(APIBaseModel):
    """Traveler creation request"""

    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    nationality: str = Field(..., min_length=2, max_length=2)
    date_of_birth: Optional[date] = None
    passport: Optional[PassportInfo] = None
    preferences: Optional[TravelerPreferences] = None
    emergency_contact: Optional[EmergencyContact] = None


class TravelerUpdate(APIBaseModel):
    """Traveler update request"""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    passport: Optional[PassportInfo] = None
    preferences: Optional[TravelerPreferences] = None
    emergency_contact: Optional[EmergencyContact] = None
    notes: Optional[str] = None


class TravelerResponse(APIBaseModel):
    """Traveler response"""

    id: str
    name: str
    email: EmailStr
    phone: str
    nationality: str
    date_of_birth: Optional[date] = None
    passport: Optional[PassportInfo] = None
    preferences: TravelerPreferences
    emergency_contact: Optional[EmergencyContact] = None
    total_bookings: int
    total_spent: float
    created_at: datetime
```

---

## Flight Models

**File**: `app/models/flight.py`

### Flight Models

```python
from pydantic import Field
from typing import List, Optional
from datetime import datetime
from enum import Enum
from app.models.base import APIBaseModel, Price


class CabinClass(str, Enum):
    """Flight cabin class"""

    ECONOMY = "economy"
    PREMIUM_ECONOMY = "premium_economy"
    BUSINESS = "business"
    FIRST = "first"


class PassengerType(str, Enum):
    """Passenger type"""

    ADULT = "adult"
    CHILD = "child"
    INFANT = "infant"


class FlightSegment(BaseModel):
    """Flight segment"""

    departure: Dict[str, Any] = Field(
        ...,
        description="Departure airport, terminal, datetime"
    )
    arrival: Dict[str, Any] = Field(
        ...,
        description="Arrival airport, terminal, datetime"
    )
    airline: str = Field(..., min_length=2, max_length=3, description="Airline code")
    airline_name: Optional[str] = None
    flight_number: str
    aircraft: Optional[str] = None
    duration: str = Field(..., description="Duration in ISO 8601 format")
    cabin_class: CabinClass


class FlightItinerary(BaseModel):
    """Flight itinerary (outbound or inbound)"""

    segments: List[FlightSegment]
    total_duration: str = Field(..., description="Total duration in ISO 8601")


class FlightOffer(BaseModel):
    """Flight offer"""

    id: str
    type: str = Field(default="flight-offer")
    price: Price
    outbound: FlightItinerary
    inbound: Optional[FlightItinerary] = None
    booking_class: str
    seats_available: int
    validating_airline: str


class FlightSearchParams(APIBaseModel):
    """Flight search parameters"""

    origin: str = Field(..., min_length=2, description="City name or IATA code")
    destination: str = Field(..., min_length=2, description="City name or IATA code")
    departure_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    return_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    adults: int = Field(..., ge=1, le=9)
    children: int = Field(default=0, ge=0, le=9)
    infants: int = Field(default=0, ge=0, le=9)
    cabin_class: CabinClass = CabinClass.ECONOMY
    non_stop: bool = False
    max_price: Optional[float] = Field(None, gt=0)


class PassengerDetails(BaseModel):
    """Passenger details for booking"""

    type: PassengerType
    title: str = Field(..., pattern="^(Mr|Ms|Mrs|Dr|Prof)$")
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    date_of_birth: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    nationality: str = Field(..., min_length=2, max_length=2)
    passport: Optional[PassportInfo] = None
    frequent_flyer: Optional[str] = None


class FlightBookingRequest(APIBaseModel):
    """Flight booking request"""

    offer_id: str
    passengers: List[PassengerDetails] = Field(..., min_length=1)
    contact: ContactInfo


class FlightBookingResponse(APIBaseModel):
    """Flight booking response"""

    booking_id: str
    booking_reference: str
    status: str
    amadeus_booking_id: str
    passengers: List[PassengerDetails]
    flight_details: FlightOffer
    total_price: Price
```

---

## Hotel Models

**File**: `app/models/hotel.py`

### Hotel Models

```python
from pydantic import Field
from typing import List, Optional
from app.models.base import APIBaseModel, Location, Price


class HotelRoom(BaseModel):
    """Hotel room details"""

    room_type: str
    description: Optional[str] = None
    max_occupancy: int = Field(..., ge=1)
    amenities: List[str] = Field(default_factory=list)
    price_per_night: float = Field(..., gt=0)
    total_price: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    available_rooms: int = Field(..., ge=0)


class HotelOffer(BaseModel):
    """Hotel offer"""

    id: str
    name: str = Field(..., min_length=1, max_length=200)
    star_rating: int = Field(..., ge=0, le=5)
    location: Location
    images: List[str] = Field(default_factory=list)
    amenities: List[str] = Field(default_factory=list)
    rooms: List[HotelRoom]
    rating: Optional[Dict[str, Any]] = Field(
        None,
        description="Average rating and review count"
    )


class RoomRequest(BaseModel):
    """Room request"""

    adults: int = Field(..., ge=1, le=9)
    children: int = Field(default=0, ge=0, le=9)


class HotelSearchParams(APIBaseModel):
    """Hotel search parameters"""

    city: str = Field(..., min_length=2)
    check_in: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    check_out: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    rooms: List[RoomRequest] = Field(..., min_length=1)
    filters: Optional[Dict[str, Any]] = None


class HotelBookingRequest(APIBaseModel):
    """Hotel booking request"""

    hotel_id: str
    room_type: str
    check_in: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    check_out: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    guest: PassengerDetails
    special_requests: Optional[str] = None


class HotelBookingResponse(APIBaseModel):
    """Hotel booking response"""

    booking_id: str
    booking_reference: str
    status: str
    hotel_name: str
    room_type: str
    check_in: str
    check_out: str
    total_price: Price
    voucher_url: Optional[str] = None
```

---

## Transport Models

**File**: `app/models/transport.py`

### Transport Models

```python
from pydantic import Field
from typing import Optional, List
from enum import Enum
from app.models.base import APIBaseModel, Price


class TransportType(str, Enum):
    """Transport type"""

    AIRPORT_TRANSFER = "airport_transfer"
    HOTEL_TRANSFER = "hotel_transfer"
    CITY_TOUR = "city_tour"
    CAR_RENTAL = "car_rental"
    PRIVATE_DRIVER = "private_driver"


class VehicleType(str, Enum):
    """Vehicle type"""

    SEDAN = "sedan"
    SUV = "suv"
    VAN = "van"
    BUS = "bus"
    LUXURY = "luxury"


class TransportOption(BaseModel):
    """Transport option"""

    id: str
    type: TransportType
    vehicle_type: VehicleType
    max_passengers: int = Field(..., ge=1)
    max_luggage: int = Field(..., ge=0)
    duration_minutes: int = Field(..., gt=0)
    price: Price
    provider: str
    vehicle_details: Optional[Dict[str, Any]] = None


class TransportSearchParams(APIBaseModel):
    """Transport search parameters"""

    transport_type: TransportType
    from_location: str = Field(..., min_length=1)
    to_location: str = Field(..., min_length=1)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    passengers: int = Field(..., ge=1, le=50)
    luggage: int = Field(default=0, ge=0)


class TransportBookingRequest(APIBaseModel):
    """Transport booking request"""

    transport_id: str
    pickup_location: str
    dropoff_location: str
    pickup_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    pickup_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    passenger_name: str = Field(..., min_length=1, max_length=100)
    passenger_phone: str = Field(..., min_length=7, max_length=20)
    flight_number: Optional[str] = None
    special_requests: Optional[str] = None


class TransportBookingResponse(APIBaseModel):
    """Transport booking response"""

    booking_id: str
    booking_reference: str
    status: str
    transport_details: TransportOption
    pickup_details: Dict[str, str]
    total_price: Price
```

---

## Experience Models

**File**: `app/models/experience.py`

### Experience Models

```python
from pydantic import Field
from typing import List, Optional
from enum import Enum
from app.models.base import APIBaseModel, MongoBaseModel, Location, Price


class ExperienceType(str, Enum):
    """Experience type"""

    SAFARI = "safari"
    TOUR = "tour"
    ACTIVITY = "activity"
    EXCURSION = "excursion"
    CRUISE = "cruise"


class Difficulty(str, Enum):
    """Difficulty level"""

    EASY = "easy"
    MODERATE = "moderate"
    CHALLENGING = "challenging"
    EXTREME = "extreme"


class Experience(MongoBaseModel):
    """Experience document model"""

    name: str = Field(..., min_length=1, max_length=200)
    type: ExperienceType
    description: str
    destination: str = Field(..., description="Country, city, or region")
    location: Optional[Location] = None
    duration_days: int = Field(..., ge=1)
    includes: List[str] = Field(default_factory=list)
    excludes: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    difficulty: Difficulty
    min_participants: int = Field(default=1, ge=1)
    max_participants: int = Field(..., ge=1)
    price_per_person: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    available_dates: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    rating: Optional[Dict[str, Any]] = None
    provider_id: Optional[str] = None
    active: bool = True


class ExperienceSearchParams(APIBaseModel):
    """Experience search parameters"""

    destination: str = Field(..., min_length=2)
    experience_type: Optional[ExperienceType] = None
    start_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    duration_days: Optional[int] = Field(None, ge=1)
    participants: int = Field(default=1, ge=1)
    filters: Optional[Dict[str, Any]] = None


class ParticipantInfo(BaseModel):
    """Participant information"""

    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=120)
    dietary_requirements: List[str] = Field(default_factory=list)
    medical_conditions: Optional[str] = None


class ExperienceBookingRequest(APIBaseModel):
    """Experience booking request"""

    experience_id: str
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    participants: List[ParticipantInfo] = Field(..., min_length=1)
    special_requests: Optional[str] = None


class ExperienceBookingResponse(APIBaseModel):
    """Experience booking response"""

    booking_id: str
    booking_reference: str
    status: str
    experience_name: str
    start_date: str
    participants_count: int
    total_price: Price
    voucher_url: Optional[str] = None
```

---

## Booking Models

**File**: `app/models/booking.py`

### Booking Models

```python
from pydantic import Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from app.models.base import MongoBaseModel, APIBaseModel, Location


class BookingStatus(str, Enum):
    """Booking status"""

    PENDING = "pending"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class ServiceBooking(BaseModel):
    """Individual service booking within a trip"""

    id: str
    type: str  # flight, hotel, transport, experience
    name: str
    status: str
    booking_reference: Optional[str] = None
    details: Dict[str, Any]
    price: float


class TripDetails(BaseModel):
    """Trip details"""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    destination: Location
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    duration_days: int = Field(..., ge=1)
    adults: int = Field(..., ge=1)
    children: int = Field(default=0, ge=0)
    infants: int = Field(default=0, ge=0)


class BookingPricing(BaseModel):
    """Booking pricing breakdown"""

    services: Dict[str, float] = Field(
        default_factory=dict,
        description="Price by service type"
    )
    subtotal: float = Field(..., ge=0)
    taxes: float = Field(default=0, ge=0)
    fees: float = Field(default=0, ge=0)
    discounts: float = Field(default=0, ge=0)
    total: float = Field(..., ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


class PaymentScheduleItem(BaseModel):
    """Payment schedule item"""

    type: str = Field(..., pattern="^(deposit|installment|balance)$")
    amount: float = Field(..., gt=0)
    due_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    paid: bool = False
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class BookingPayment(BaseModel):
    """Booking payment information"""

    status: str = Field(
        ...,
        pattern="^(pending|partial|paid|refunded)$"
    )
    paid_amount: float = Field(default=0, ge=0)
    outstanding: float = Field(..., ge=0)
    payment_schedule: List[PaymentScheduleItem] = Field(default_factory=list)


class BookingDocument(BaseModel):
    """Booking document"""

    type: str = Field(
        ...,
        pattern="^(invoice|itinerary|receipt|voucher|contract)$"
    )
    url: str
    generated_at: datetime


class BookingNote(BaseModel):
    """Booking note"""

    id: str
    author: str
    content: str
    created_at: datetime


class Booking(MongoBaseModel):
    """Complete booking document model"""

    booking_code: str = Field(..., min_length=1, max_length=50)
    organization_id: str
    user_id: str
    traveler_id: str
    trip: TripDetails
    services: Dict[str, List[ServiceBooking]] = Field(
        default_factory=lambda: {
            'flights': [],
            'hotels': [],
            'transport': [],
            'experiences': []
        }
    )
    pricing: BookingPricing
    payment: BookingPayment
    status: BookingStatus
    documents: List[BookingDocument] = Field(default_factory=list)
    notes: List[BookingNote] = Field(default_factory=list)
    cancellation: Optional[Dict[str, Any]] = None


class BookingCreateRequest(APIBaseModel):
    """Booking creation request"""

    traveler_id: str
    trip: TripDetails
    services: Dict[str, List[Dict[str, Any]]]
    payment_schedule: Optional[List[PaymentScheduleItem]] = None


class BookingUpdateRequest(APIBaseModel):
    """Booking update request"""

    status: Optional[BookingStatus] = None
    trip: Optional[TripDetails] = None
    services: Optional[Dict[str, List[Dict[str, Any]]]] = None


class BookingResponse(APIBaseModel):
    """Booking response"""

    id: str
    booking_code: str
    status: BookingStatus
    traveler: Dict[str, Any]
    trip: TripDetails
    services: Dict[str, List[ServiceBooking]]
    pricing: BookingPricing
    payment: BookingPayment
    documents: List[BookingDocument]
    created_at: datetime
    updated_at: datetime
```

---

## Payment Models

**File**: `app/models/payment.py`

### Payment Models

```python
from pydantic import Field
from typing import Optional
from enum import Enum
from datetime import datetime
from app.models.base import MongoBaseModel, APIBaseModel


class PaymentMethod(str, Enum):
    """Payment method"""

    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    MOBILE_MONEY = "mobile_money"
    CASH = "cash"
    PAYPAL = "paypal"
    STRIPE = "stripe"


class PaymentStatus(str, Enum):
    """Payment status"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class Payment(MongoBaseModel):
    """Payment document model"""

    booking_id: str
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    status: PaymentStatus
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None
    organization_id: str
    user_id: str
    receipt_url: Optional[str] = None
    refund_amount: Optional[float] = Field(None, ge=0)
    refund_date: Optional[datetime] = None


class PaymentCreateRequest(APIBaseModel):
    """Payment creation request"""

    booking_id: str
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(APIBaseModel):
    """Payment response"""

    id: str
    booking_id: str
    amount: float
    currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    payment_date: Optional[datetime] = None
    receipt_url: Optional[str] = None
    created_at: datetime
```

---

## Conversation Models

**File**: `app/models/conversation.py`

### Conversation Models

```python
from pydantic import Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from app.models.base import MongoBaseModel, APIBaseModel


class ConversationStatus(str, Enum):
    """Conversation status"""

    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"


class MessageRole(str, Enum):
    """Message role"""

    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """Conversation message"""

    id: str
    role: MessageRole
    content: str
    intent: Optional[str] = None
    intent_confidence: Optional[float] = Field(None, ge=0, le=1)
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Conversation(MongoBaseModel):
    """Conversation document model"""

    organization_id: str
    user_id: str
    conversation_type: str = Field(
        ...,
        pattern="^(booking|inquiry|support|general)$"
    )
    title: str = Field(..., min_length=1, max_length=200)
    status: ConversationStatus = ConversationStatus.ACTIVE
    messages: List[Message] = Field(default_factory=list)
    context: Dict[str, Any] = Field(
        default_factory=dict,
        description="Conversation context and state"
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ConversationCreateRequest(APIBaseModel):
    """Conversation creation request"""

    conversation_type: str = Field(
        default="general",
        pattern="^(booking|inquiry|support|general)$"
    )
    title: Optional[str] = "New Conversation"


class MessageRequest(APIBaseModel):
    """Message send request"""

    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[str] = None


class MessageResponse(APIBaseModel):
    """Message response"""

    conversation_id: str
    message_id: str
    response: str
    intent: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    suggested_actions: Optional[List[Dict[str, Any]]] = None
    success: bool


class ConversationResponse(APIBaseModel):
    """Conversation response"""

    id: str
    title: str
    status: ConversationStatus
    messages: List[Message]
    created_at: datetime
    updated_at: datetime
```

---

## Organization Models

**File**: `app/models/organization.py`

### Organization Models

```python
from pydantic import Field, HttpUrl
from typing import Optional, Dict, Any, List
from enum import Enum
from app.models.base import MongoBaseModel, APIBaseModel, Location, ContactInfo


class BusinessType(str, Enum):
    """Business type"""

    DMC = "dmc"
    TRAVEL_AGENCY = "travel_agency"
    TOUR_OPERATOR = "tour_operator"
    HOTEL = "hotel"
    TRANSPORT = "transport"


class SubscriptionPlan(str, Enum):
    """Subscription plan"""

    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """Subscription status"""

    ACTIVE = "active"
    TRIAL = "trial"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


class OrganizationBranding(BaseModel):
    """Organization branding"""

    logo_url: Optional[HttpUrl] = None
    cover_image_url: Optional[HttpUrl] = None
    primary_color: str = Field(
        default="#2C5F2D",
        pattern="^#[0-9A-Fa-f]{6}$"
    )
    secondary_color: str = Field(
        default="#97BC62",
        pattern="^#[0-9A-Fa-f]{6}$"
    )


class OrganizationSettings(BaseModel):
    """Organization settings"""

    default_currency: str = Field(default="USD", min_length=3, max_length=3)
    timezone: str = Field(default="UTC")
    languages: List[str] = Field(default_factory=lambda: ["en"])
    payment_terms_days: int = Field(default=30, ge=0)
    deposit_percentage: int = Field(default=30, ge=0, le=100)
    auto_confirm_bookings: bool = False


class OrganizationSubscription(BaseModel):
    """Organization subscription"""

    plan: SubscriptionPlan
    status: SubscriptionStatus
    billing_cycle: str = Field(
        default="monthly",
        pattern="^(monthly|yearly)$"
    )
    next_billing_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    trial_ends_at: Optional[datetime] = None


class Organization(MongoBaseModel):
    """Organization document model"""

    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern="^[a-z0-9-]+$",
        description="URL-friendly identifier"
    )
    business_type: BusinessType
    country: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    contact: ContactInfo
    location: Optional[Location] = None
    branding: OrganizationBranding = Field(default_factory=OrganizationBranding)
    settings: OrganizationSettings = Field(default_factory=OrganizationSettings)
    subscription: OrganizationSubscription
    public_profile: Dict[str, Any] = Field(
        default_factory=dict,
        description="Public profile information"
    )
    chat_enabled: bool = True
    active: bool = True


class OrganizationCreate(APIBaseModel):
    """Organization creation request"""

    name: str = Field(..., min_length=1, max_length=200)
    business_type: BusinessType
    country: str = Field(..., min_length=2, max_length=2)
    email: str
    phone: str
    website: Optional[HttpUrl] = None


class OrganizationUpdate(APIBaseModel):
    """Organization update request"""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact: Optional[ContactInfo] = None
    branding: Optional[OrganizationBranding] = None
    settings: Optional[OrganizationSettings] = None


class OrganizationResponse(APIBaseModel):
    """Organization response"""

    id: str
    name: str
    slug: str
    business_type: BusinessType
    country: str
    contact: ContactInfo
    branding: OrganizationBranding
    settings: OrganizationSettings
    subscription: OrganizationSubscription
    created_at: datetime
```

---

## Validation Rules

### Common Validation Patterns

```python
# Email validation
EmailStr  # Built-in Pydantic email validator

# Date validation (ISO 8601)
pattern=r"^\d{4}-\d{2}-\d{2}$"

# Time validation (HH:MM)
pattern=r"^\d{2}:\d{2}$"

# Phone number validation
min_length=7, max_length=20

# Country code (ISO 3166-1 alpha-2)
min_length=2, max_length=2

# Currency code (ISO 4217)
min_length=3, max_length=3

# URL validation
HttpUrl  # Built-in Pydantic URL validator

# Color hex code
pattern="^#[0-9A-Fa-f]{6}$"

# Slug (URL-friendly)
pattern="^[a-z0-9-]+$"

# Positive number
gt=0  # Greater than zero
ge=0  # Greater than or equal to zero

# Range validation
ge=1, le=100  # Between 1 and 100
```

### Custom Validators

```python
from pydantic import field_validator

class MyModel(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        """Ensure email is lowercase"""
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Additional checks...
        return v
```

---

**End of Data Models Design**

This document defines all Pydantic models with complete type safety, validation rules, and serialization configuration. All models are ready for implementation.
