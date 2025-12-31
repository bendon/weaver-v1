"""
Booking Models for TravelWeaver V2
"""

from pydantic import Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from app.v2.models.base import MongoBaseModel, APIBaseModel, Location


class BookingStatus(str, Enum):
    """Booking status"""

    PENDING = "pending"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class TripDetails(APIBaseModel):
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


class BookingPricing(APIBaseModel):
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


class PaymentScheduleItem(APIBaseModel):
    """Payment schedule item"""

    type: str = Field(..., pattern="^(deposit|installment|balance)$")
    amount: float = Field(..., gt=0)
    due_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    paid: bool = False
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class BookingPayment(APIBaseModel):
    """Booking payment information"""

    status: str = Field(
        ...,
        pattern="^(pending|partial|paid|refunded)$"
    )
    paid_amount: float = Field(default=0, ge=0)
    outstanding: float = Field(..., ge=0)
    payment_schedule: List[PaymentScheduleItem] = Field(default_factory=list)


class Booking(MongoBaseModel):
    """Complete booking document model"""

    booking_code: str = Field(..., min_length=1, max_length=50)
    organization_id: str
    user_id: str
    traveler_id: str
    trip: TripDetails
    services: Dict[str, List[Dict[str, Any]]] = Field(
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
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    notes: List[Dict[str, Any]] = Field(default_factory=list)
    cancellation: Optional[Dict[str, Any]] = None


class BookingCreateRequest(APIBaseModel):
    """Booking creation request"""

    traveler_id: str
    trip: TripDetails
    services: Dict[str, List[Dict[str, Any]]]
    payment_schedule: Optional[List[PaymentScheduleItem]] = None


class BookingResponse(APIBaseModel):
    """Booking response"""

    id: str
    booking_code: str
    status: BookingStatus
    traveler: Dict[str, Any]
    trip: TripDetails
    services: Dict[str, List[Dict[str, Any]]]
    pricing: BookingPricing
    payment: BookingPayment
    created_at: Any  # datetime
    updated_at: Any  # datetime
