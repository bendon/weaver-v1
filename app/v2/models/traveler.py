"""
Traveler Models for TravelWeaver V2
"""

from pydantic import Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date
from app.v2.models.base import MongoBaseModel, APIBaseModel


class PassportInfo(APIBaseModel):
    """Passport information"""

    number: str = Field(..., min_length=5, max_length=20)
    country: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    issue_date: Optional[date] = None
    expiry_date: date


class EmergencyContact(APIBaseModel):
    """Emergency contact information"""

    name: str = Field(..., min_length=1, max_length=100)
    relationship: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[EmailStr] = None


class TravelerPreferences(APIBaseModel):
    """Traveler preferences"""

    dietary: List[str] = Field(default_factory=list, description="Dietary requirements")
    seat_preference: Optional[str] = Field(None, pattern="^(window|aisle|middle)$")
    room_type: Optional[str] = Field(None, pattern="^(single|double|twin|suite)$")
    special_needs: Optional[str] = None


class TravelHistoryItem(APIBaseModel):
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
    notes: Optional[str] = None


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
    created_at: Any  # datetime
    updated_at: Any  # datetime
