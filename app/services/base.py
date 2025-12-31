"""
Service Layer Base Classes and Types
Provides foundation for all business logic services
"""
from typing import TypedDict, Optional, List, Any, Dict
from datetime import datetime
from abc import ABC, abstractmethod


# ==================== Type Definitions ====================

class ValidationError(Exception):
    """Raised when validation fails"""
    pass


class ServiceError(Exception):
    """Raised when a service operation fails"""
    pass


class FlightSearchParams(TypedDict, total=False):
    """Parameters for flight search"""
    origin: str  # City name or IATA code
    destination: str  # City name or IATA code
    departure_date: str  # YYYY-MM-DD
    return_date: Optional[str]  # YYYY-MM-DD
    adults: int
    max_results: int


class FlightOffer(TypedDict):
    """Formatted flight offer"""
    offer_id: str
    price: str
    route: str
    departure: str
    arrival: str
    duration: str
    stops: int
    carrier: str
    flight_number: str
    full_offer: Dict[str, Any]


class BookingCreateData(TypedDict, total=False):
    """Data for creating a booking"""
    title: str
    start_date: str
    end_date: str
    total_travelers: int
    notes: Optional[str]
    organization_id: str
    created_by: str


class TravelerData(TypedDict, total=False):
    """Data for creating/updating a traveler"""
    first_name: str
    last_name: str
    email: Optional[str]
    phone: str
    organization_id: str


class HotelSearchParams(TypedDict, total=False):
    """Parameters for hotel search"""
    city_code: str
    check_in_date: str
    check_out_date: str
    adults: int
    rooms: int
    radius: int


class ServiceResult(TypedDict):
    """Standard result from service operations"""
    success: bool
    data: Optional[Any]
    error: Optional[str]
    message: Optional[str]


# ==================== Base Service ====================

class BaseService(ABC):
    """
    Base class for all services
    Provides common functionality and interface
    """

    def __init__(self):
        self.name = self.__class__.__name__

    def validate_required_fields(self, data: Dict[str, Any], required: List[str]) -> None:
        """Validate that all required fields are present"""
        missing = [field for field in required if field not in data or data[field] is None]
        if missing:
            raise ValidationError(f"Missing required fields: {', '.join(missing)}")

    def validate_date(self, date_str: str, field_name: str = "date") -> None:
        """Validate date format and value"""
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            if date_obj.date() < datetime.now().date():
                raise ValidationError(f"{field_name} must be today or in the future")
        except ValueError:
            raise ValidationError(f"{field_name} must be in YYYY-MM-DD format")

    def validate_date_range(self, start_date: str, end_date: str) -> None:
        """Validate that end date is after start date"""
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            if end <= start:
                raise ValidationError("End date must be after start date")
        except ValueError:
            raise ValidationError("Dates must be in YYYY-MM-DD format")

    def success(self, data: Any = None, message: str = None) -> ServiceResult:
        """Return a success result"""
        return {
            "success": True,
            "data": data,
            "error": None,
            "message": message
        }

    def error(self, error: str, data: Any = None) -> ServiceResult:
        """Return an error result"""
        return {
            "success": False,
            "data": data,
            "error": error,
            "message": None
        }
