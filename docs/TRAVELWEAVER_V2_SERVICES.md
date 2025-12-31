# TravelWeaver 2.0 - Service Layer Design

**Version**: 2.0
**Date**: 2025-12-31
**Status**: Design Phase

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [Base Service](#base-service)
3. [Flight Service](#flight-service)
4. [Hotel Service](#hotel-service)
5. [Transport Service](#transport-service)
6. [Experience Service](#experience-service)
7. [Booking Service](#booking-service)
8. [Traveler Service](#traveler-service)
9. [Payment Service](#payment-service)
10. [Notification Service](#notification-service)
11. [WeaverAssistant Service](#weaverassistant-service)
12. [Error Handling](#error-handling)
13. [Testing Strategy](#testing-strategy)

---

## Service Architecture

### Principles

1. **Single Responsibility**: Each service handles one domain
2. **Deterministic Logic**: All business logic is code-based (no AI in services)
3. **Testability**: All services are unit testable
4. **Dependency Injection**: Services receive dependencies via constructor
5. **Error Handling**: Consistent error patterns across all services
6. **Logging**: Comprehensive logging for debugging and monitoring

### Service Layer Structure

```
app/services/
├── __init__.py
├── base.py                    # Base service class
├── flight_service.py          # Flight search and booking
├── hotel_service.py           # Hotel search and booking
├── transport_service.py       # Transport booking
├── experience_service.py      # Experience/tour booking
├── booking_service.py         # Booking orchestration
├── traveler_service.py        # Traveler management
├── payment_service.py         # Payment processing
├── notification_service.py    # Email/SMS notifications
└── weaver_assistant_service.py # AI orchestration
```

### Data Flow

```
API Layer (FastAPI)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Database (MongoDB + SQLite)
```

---

## Base Service

**File**: `app/services/base.py`

### Purpose
Provides common functionality for all services including validation, error handling, and logging.

### Class Definition

```python
from abc import ABC
from typing import Any, Dict, List, Optional, TypedDict
from datetime import datetime
import logging


class ServiceResult(TypedDict):
    """Standard service result format"""
    success: bool
    data: Optional[Any]
    error: Optional[str]
    message: Optional[str]
    meta: Optional[Dict[str, Any]]


class ValidationError(Exception):
    """Raised when validation fails"""
    pass


class ServiceError(Exception):
    """Raised when service operation fails"""
    pass


class BaseService(ABC):
    """
    Base class for all services

    Provides:
    - Validation helpers
    - Error handling
    - Result formatting
    - Logging
    """

    def __init__(self):
        """Initialize base service"""
        self.logger = logging.getLogger(self.__class__.__name__)

    def validate_required_fields(
        self,
        data: Dict[str, Any],
        required: List[str]
    ) -> None:
        """
        Validate that all required fields are present

        Args:
            data: Data dictionary to validate
            required: List of required field names

        Raises:
            ValidationError: If any required fields are missing
        """
        missing = [
            field for field in required
            if field not in data or data[field] is None
        ]
        if missing:
            raise ValidationError(
                f"Missing required fields: {', '.join(missing)}"
            )

    def validate_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> None:
        """
        Validate that date range is valid

        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)

        Raises:
            ValidationError: If date range is invalid
        """
        from datetime import datetime

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        if end <= start:
            raise ValidationError("End date must be after start date")

        if start < datetime.now():
            raise ValidationError("Start date cannot be in the past")

    def success(
        self,
        data: Any = None,
        message: str = None,
        meta: Dict[str, Any] = None
    ) -> ServiceResult:
        """
        Return a success result

        Args:
            data: Result data
            message: Success message
            meta: Additional metadata

        Returns:
            ServiceResult with success=True
        """
        return {
            "success": True,
            "data": data,
            "error": None,
            "message": message,
            "meta": meta or {}
        }

    def error(
        self,
        error: str,
        message: str = None,
        meta: Dict[str, Any] = None
    ) -> ServiceResult:
        """
        Return an error result

        Args:
            error: Error code or description
            message: User-friendly error message
            meta: Additional error metadata

        Returns:
            ServiceResult with success=False
        """
        self.logger.error(f"Service error: {error}")
        return {
            "success": False,
            "data": None,
            "error": error,
            "message": message or error,
            "meta": meta or {}
        }

    def log_operation(
        self,
        operation: str,
        params: Dict[str, Any],
        result: str = "started"
    ) -> None:
        """
        Log service operation

        Args:
            operation: Operation name
            params: Operation parameters
            result: Operation result (started, success, failed)
        """
        self.logger.info(
            f"{operation} {result}",
            extra={"params": params}
        )
```

---

## Flight Service

**File**: `app/services/flight_service.py`

### Purpose
Handles all flight-related operations including search and booking via Amadeus API.

### Dependencies
- Amadeus Client (third-party API)
- SQLite (airport/airline reference data)
- MongoDB (booking storage)

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult, ValidationError
from app.amadeus_client import AmadeusClient


class FlightSearchParams(TypedDict):
    """Flight search parameters"""
    origin: str                    # City name or IATA code
    destination: str               # City name or IATA code
    departure_date: str            # ISO date format
    return_date: Optional[str]     # ISO date format (None for one-way)
    adults: int                    # Number of adults (1-9)
    children: int                  # Number of children (0-9)
    infants: int                   # Number of infants (0-9)
    cabin_class: str               # economy, premium_economy, business, first
    non_stop: bool                 # Only non-stop flights
    max_price: Optional[float]     # Maximum price filter


class FlightBookingParams(TypedDict):
    """Flight booking parameters"""
    offer_id: str                  # Amadeus offer ID
    passengers: List[Dict[str, Any]]  # Passenger details
    contact: Dict[str, str]        # Contact information
    organization_id: str           # DMC organization ID
    user_id: str                   # User creating booking


class FlightService(BaseService):
    """
    Flight Service

    Responsibilities:
    - Search flights via Amadeus API
    - Convert city names to IATA codes
    - Format flight offers
    - Book flights
    - Retrieve booking details
    - Cancel bookings
    """

    def __init__(
        self,
        amadeus_client: AmadeusClient,
        db_sqlite,  # SQLite connection for reference data
        db_mongo     # MongoDB connection for bookings
    ):
        """
        Initialize flight service

        Args:
            amadeus_client: Amadeus API client
            db_sqlite: SQLite database connection
            db_mongo: MongoDB database connection
        """
        super().__init__()
        self.amadeus = amadeus_client
        self.db_sqlite = db_sqlite
        self.db_mongo = db_mongo

    def search_flights(
        self,
        params: FlightSearchParams
    ) -> ServiceResult:
        """
        Search for flights

        Args:
            params: Flight search parameters

        Returns:
            ServiceResult containing list of flight offers

        Raises:
            ValidationError: If search parameters are invalid
            ServiceError: If Amadeus API call fails

        Example:
            >>> service.search_flights({
            ...     "origin": "New York",
            ...     "destination": "Nairobi",
            ...     "departure_date": "2025-02-15",
            ...     "return_date": "2025-02-25",
            ...     "adults": 2,
            ...     "children": 1,
            ...     "cabin_class": "economy"
            ... })
            {
                "success": True,
                "data": {
                    "offers": [...],
                    "total_results": 12
                }
            }
        """
        try:
            # Validate required fields
            self.validate_required_fields(params, [
                'origin', 'destination', 'departure_date', 'adults'
            ])

            # Validate dates
            if params.get('return_date'):
                self.validate_date_range(
                    params['departure_date'],
                    params['return_date']
                )

            # Convert city names to IATA codes
            origin_code = self._get_iata_code(params['origin'])
            destination_code = self._get_iata_code(params['destination'])

            # Log operation
            self.log_operation('search_flights', {
                'origin': origin_code,
                'destination': destination_code,
                'departure_date': params['departure_date']
            })

            # Call Amadeus API
            amadeus_params = {
                'originLocationCode': origin_code,
                'destinationLocationCode': destination_code,
                'departureDate': params['departure_date'],
                'adults': params['adults'],
                'children': params.get('children', 0),
                'infants': params.get('infants', 0),
                'travelClass': params.get('cabin_class', 'ECONOMY').upper(),
                'nonStop': params.get('non_stop', False),
                'maxPrice': params.get('max_price')
            }

            if params.get('return_date'):
                amadeus_params['returnDate'] = params['return_date']

            response = self.amadeus.shopping.flight_offers_search.get(
                **amadeus_params
            )

            # Format results
            offers = self._format_flight_offers(response.data)

            # Log success
            self.log_operation('search_flights', amadeus_params, 'success')

            return self.success(
                data={
                    'offers': offers,
                    'total_results': len(offers),
                    'search_params': {
                        'origin': origin_code,
                        'destination': destination_code,
                        'departure_date': params['departure_date'],
                        'return_date': params.get('return_date')
                    }
                },
                message=f"Found {len(offers)} flight offers"
            )

        except ValidationError as e:
            return self.error(
                error='VALIDATION_ERROR',
                message=str(e)
            )
        except Exception as e:
            self.logger.error(f"Flight search failed: {str(e)}")
            return self.error(
                error='SEARCH_FAILED',
                message='Failed to search flights. Please try again.'
            )

    def book_flight(
        self,
        params: FlightBookingParams
    ) -> ServiceResult:
        """
        Book a flight

        Args:
            params: Flight booking parameters

        Returns:
            ServiceResult containing booking confirmation

        Example:
            >>> service.book_flight({
            ...     "offer_id": "flt_offer_001",
            ...     "passengers": [{
            ...         "type": "adult",
            ...         "first_name": "Jane",
            ...         "last_name": "Smith",
            ...         "date_of_birth": "1985-06-15",
            ...         "passport": {...}
            ...     }],
            ...     "contact": {...}
            ... })
        """
        try:
            # Validate required fields
            self.validate_required_fields(params, [
                'offer_id', 'passengers', 'contact'
            ])

            # Price confirmation (ensure price hasn't changed)
            price_check = self.amadeus.shopping.flight_offers.pricing.post(
                params['offer_id']
            )

            # Create booking via Amadeus
            booking_response = self.amadeus.booking.flight_orders.post(
                price_check.data
            )

            # Store booking in MongoDB
            booking_doc = {
                'type': 'flight',
                'amadeus_booking_id': booking_response.data['id'],
                'booking_reference': booking_response.data.get('associatedRecords', [{}])[0].get('reference'),
                'status': 'confirmed',
                'passengers': params['passengers'],
                'contact': params['contact'],
                'organization_id': params['organization_id'],
                'user_id': params['user_id'],
                'created_at': datetime.utcnow(),
                'raw_response': booking_response.data
            }

            result = self.db_mongo.flight_bookings.insert_one(booking_doc)

            return self.success(
                data={
                    'booking_id': str(result.inserted_id),
                    'booking_reference': booking_doc['booking_reference'],
                    'status': 'confirmed',
                    'amadeus_booking_id': booking_doc['amadeus_booking_id']
                },
                message='Flight booked successfully'
            )

        except Exception as e:
            self.logger.error(f"Flight booking failed: {str(e)}")
            return self.error(
                error='BOOKING_FAILED',
                message='Failed to book flight. Please try again.'
            )

    def get_booking(
        self,
        booking_id: str,
        organization_id: str
    ) -> ServiceResult:
        """
        Retrieve flight booking details

        Args:
            booking_id: Booking ID
            organization_id: Organization ID (for authorization)

        Returns:
            ServiceResult containing booking details
        """
        try:
            from bson import ObjectId

            booking = self.db_mongo.flight_bookings.find_one({
                '_id': ObjectId(booking_id),
                'organization_id': organization_id
            })

            if not booking:
                return self.error(
                    error='BOOKING_NOT_FOUND',
                    message='Flight booking not found'
                )

            # Convert ObjectId to string
            booking['_id'] = str(booking['_id'])

            return self.success(data=booking)

        except Exception as e:
            self.logger.error(f"Get booking failed: {str(e)}")
            return self.error(
                error='GET_BOOKING_FAILED',
                message='Failed to retrieve booking'
            )

    def cancel_booking(
        self,
        booking_id: str,
        organization_id: str,
        reason: str
    ) -> ServiceResult:
        """
        Cancel a flight booking

        Args:
            booking_id: Booking ID
            organization_id: Organization ID (for authorization)
            reason: Cancellation reason

        Returns:
            ServiceResult containing cancellation details
        """
        try:
            # Get booking
            booking_result = self.get_booking(booking_id, organization_id)
            if not booking_result['success']:
                return booking_result

            booking = booking_result['data']

            # Cancel via Amadeus (if applicable)
            # Note: Amadeus cancellation depends on airline policies

            # Update booking status in MongoDB
            from bson import ObjectId

            self.db_mongo.flight_bookings.update_one(
                {'_id': ObjectId(booking_id)},
                {
                    '$set': {
                        'status': 'cancelled',
                        'cancellation': {
                            'cancelled_at': datetime.utcnow(),
                            'reason': reason
                        }
                    }
                }
            )

            return self.success(
                data={
                    'booking_id': booking_id,
                    'status': 'cancelled'
                },
                message='Flight booking cancelled successfully'
            )

        except Exception as e:
            self.logger.error(f"Cancel booking failed: {str(e)}")
            return self.error(
                error='CANCEL_FAILED',
                message='Failed to cancel booking'
            )

    # Private helper methods

    def _get_iata_code(self, location: str) -> str:
        """
        Convert city name to IATA code using SQLite reference data

        Args:
            location: City name or IATA code

        Returns:
            IATA code

        Raises:
            ValidationError: If location not found
        """
        # If already IATA code (3 letters), return as-is
        if len(location) == 3 and location.isupper():
            return location

        # Look up in SQLite airports table
        cursor = self.db_sqlite.execute(
            "SELECT iata_code FROM airports WHERE city = ? LIMIT 1",
            (location,)
        )
        result = cursor.fetchone()

        if not result:
            raise ValidationError(
                f"Airport not found for location: {location}"
            )

        return result[0]

    def _format_flight_offers(
        self,
        amadeus_offers: List[Dict]
    ) -> List[Dict]:
        """
        Format Amadeus flight offers for consistent API response

        Args:
            amadeus_offers: Raw Amadeus API offers

        Returns:
            Formatted flight offers
        """
        formatted = []

        for offer in amadeus_offers:
            formatted_offer = {
                'id': offer['id'],
                'type': offer['type'],
                'price': {
                    'total': float(offer['price']['total']),
                    'currency': offer['price']['currency'],
                    'base': float(offer['price']['base']),
                    'taxes': float(offer['price'].get('fees', [{}])[0].get('amount', 0))
                },
                'segments': []
            }

            # Format itineraries
            for itinerary in offer.get('itineraries', []):
                for segment in itinerary.get('segments', []):
                    formatted_offer['segments'].append({
                        'departure': {
                            'airport': segment['departure']['iataCode'],
                            'terminal': segment['departure'].get('terminal'),
                            'datetime': segment['departure']['at']
                        },
                        'arrival': {
                            'airport': segment['arrival']['iataCode'],
                            'terminal': segment['arrival'].get('terminal'),
                            'datetime': segment['arrival']['at']
                        },
                        'airline': segment['carrierCode'],
                        'flight_number': segment['number'],
                        'aircraft': segment.get('aircraft', {}).get('code'),
                        'duration': segment['duration']
                    })

            formatted.append(formatted_offer)

        return formatted
```

---

## Hotel Service

**File**: `app/services/hotel_service.py`

### Purpose
Handles hotel search and booking operations.

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult, ValidationError


class HotelSearchParams(TypedDict):
    """Hotel search parameters"""
    city: str                      # City name or code
    check_in: str                  # ISO date
    check_out: str                 # ISO date
    rooms: List[Dict[str, int]]    # [{"adults": 2, "children": 1}]
    filters: Optional[Dict[str, Any]]  # Price, stars, amenities


class HotelService(BaseService):
    """
    Hotel Service

    Responsibilities:
    - Search hotels via Amadeus API
    - Get hotel details
    - Book hotels
    - Manage hotel reservations
    """

    def __init__(
        self,
        amadeus_client,
        db_mongo
    ):
        super().__init__()
        self.amadeus = amadeus_client
        self.db_mongo = db_mongo

    def search_hotels(
        self,
        params: HotelSearchParams
    ) -> ServiceResult:
        """
        Search for hotels

        Args:
            params: Hotel search parameters

        Returns:
            ServiceResult containing list of hotels
        """
        try:
            # Validate
            self.validate_required_fields(params, [
                'city', 'check_in', 'check_out', 'rooms'
            ])

            self.validate_date_range(
                params['check_in'],
                params['check_out']
            )

            # Get city code
            city_code = self._get_city_code(params['city'])

            # Search hotels via Amadeus
            response = self.amadeus.shopping.hotel_offers_search.get(
                cityCode=city_code,
                checkInDate=params['check_in'],
                checkOutDate=params['check_out'],
                adults=sum(room['adults'] for room in params['rooms']),
                roomQuantity=len(params['rooms'])
            )

            # Format results
            hotels = self._format_hotel_offers(response.data)

            # Apply filters
            if params.get('filters'):
                hotels = self._apply_filters(hotels, params['filters'])

            return self.success(
                data={
                    'hotels': hotels,
                    'total_results': len(hotels)
                },
                message=f"Found {len(hotels)} hotels"
            )

        except ValidationError as e:
            return self.error('VALIDATION_ERROR', str(e))
        except Exception as e:
            self.logger.error(f"Hotel search failed: {str(e)}")
            return self.error('SEARCH_FAILED', 'Failed to search hotels')

    def book_hotel(
        self,
        offer_id: str,
        guest_details: Dict[str, Any],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Book a hotel

        Args:
            offer_id: Amadeus hotel offer ID
            guest_details: Guest information
            organization_id: DMC organization ID
            user_id: User creating booking

        Returns:
            ServiceResult containing booking confirmation
        """
        try:
            # Book via Amadeus
            booking_response = self.amadeus.booking.hotel_bookings.post(
                offer_id,
                guest_details
            )

            # Store in MongoDB
            booking_doc = {
                'type': 'hotel',
                'amadeus_booking_id': booking_response.data['id'],
                'booking_reference': booking_response.data.get('providerConfirmationId'),
                'status': 'confirmed',
                'guest_details': guest_details,
                'organization_id': organization_id,
                'user_id': user_id,
                'created_at': datetime.utcnow(),
                'raw_response': booking_response.data
            }

            result = self.db_mongo.hotel_bookings.insert_one(booking_doc)

            return self.success(
                data={
                    'booking_id': str(result.inserted_id),
                    'booking_reference': booking_doc['booking_reference'],
                    'status': 'confirmed'
                },
                message='Hotel booked successfully'
            )

        except Exception as e:
            self.logger.error(f"Hotel booking failed: {str(e)}")
            return self.error('BOOKING_FAILED', 'Failed to book hotel')

    def _get_city_code(self, city: str) -> str:
        """Get IATA city code"""
        # Implementation similar to flight service
        pass

    def _format_hotel_offers(self, offers: List[Dict]) -> List[Dict]:
        """Format Amadeus hotel offers"""
        # Format offers for consistent API response
        pass

    def _apply_filters(
        self,
        hotels: List[Dict],
        filters: Dict[str, Any]
    ) -> List[Dict]:
        """Apply search filters to hotel results"""
        filtered = hotels

        # Price filter
        if 'min_price' in filters:
            filtered = [
                h for h in filtered
                if h['price']['total'] >= filters['min_price']
            ]

        if 'max_price' in filters:
            filtered = [
                h for h in filtered
                if h['price']['total'] <= filters['max_price']
            ]

        # Star rating filter
        if 'star_rating' in filters:
            filtered = [
                h for h in filtered
                if h['star_rating'] in filters['star_rating']
            ]

        # Amenities filter
        if 'amenities' in filters:
            filtered = [
                h for h in filtered
                if all(a in h['amenities'] for a in filters['amenities'])
            ]

        return filtered
```

---

## Transport Service

**File**: `app/services/transport_service.py`

### Purpose
Handles ground transportation booking (airport transfers, car rentals, etc.).

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult


class TransportService(BaseService):
    """
    Transport Service

    Responsibilities:
    - Search ground transport options
    - Book transfers (airport, hotel, etc.)
    - Manage transport reservations
    - Partner with local transport providers
    """

    def __init__(self, db_mongo):
        super().__init__()
        self.db_mongo = db_mongo

    def search_transport(
        self,
        transport_type: str,
        from_location: str,
        to_location: str,
        date: str,
        time: str,
        passengers: int,
        luggage: int = 0
    ) -> ServiceResult:
        """
        Search for transport options

        Args:
            transport_type: Type (airport_transfer, car_rental, etc.)
            from_location: Pickup location
            to_location: Dropoff location
            date: Date (ISO format)
            time: Time (HH:MM format)
            passengers: Number of passengers
            luggage: Number of luggage pieces

        Returns:
            ServiceResult containing transport options
        """
        try:
            # Get available vehicles from local providers
            # This would typically integrate with partner APIs

            options = [
                {
                    'id': 'trn_001',
                    'type': transport_type,
                    'vehicle_type': 'SUV',
                    'max_passengers': 4,
                    'max_luggage': 4,
                    'price': 45.00,
                    'currency': 'USD',
                    'provider': 'Local Transport Co',
                    'duration_minutes': 30
                }
            ]

            # Filter by capacity
            filtered = [
                opt for opt in options
                if opt['max_passengers'] >= passengers
                and opt['max_luggage'] >= luggage
            ]

            return self.success(
                data={'options': filtered},
                message=f"Found {len(filtered)} transport options"
            )

        except Exception as e:
            self.logger.error(f"Transport search failed: {str(e)}")
            return self.error('SEARCH_FAILED', 'Failed to search transport')

    def book_transport(
        self,
        transport_id: str,
        booking_details: Dict[str, Any],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Book ground transport

        Args:
            transport_id: Transport option ID
            booking_details: Booking details (pickup, dropoff, passenger info)
            organization_id: DMC organization ID
            user_id: User creating booking

        Returns:
            ServiceResult containing booking confirmation
        """
        try:
            # Create booking with provider
            # This would integrate with partner API

            booking_doc = {
                'type': 'transport',
                'transport_id': transport_id,
                'booking_reference': f"TRN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                'status': 'confirmed',
                'details': booking_details,
                'organization_id': organization_id,
                'user_id': user_id,
                'created_at': datetime.utcnow()
            }

            result = self.db_mongo.transport_bookings.insert_one(booking_doc)

            return self.success(
                data={
                    'booking_id': str(result.inserted_id),
                    'booking_reference': booking_doc['booking_reference'],
                    'status': 'confirmed'
                },
                message='Transport booked successfully'
            )

        except Exception as e:
            self.logger.error(f"Transport booking failed: {str(e)}")
            return self.error('BOOKING_FAILED', 'Failed to book transport')
```

---

## Experience Service

**File**: `app/services/experience_service.py`

### Purpose
Handles tour, safari, and activity booking.

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult


class ExperienceService(BaseService):
    """
    Experience Service

    Responsibilities:
    - Manage experience catalog (safaris, tours, activities)
    - Search experiences
    - Book experiences
    - Partner with experience providers
    """

    def __init__(self, db_mongo):
        super().__init__()
        self.db_mongo = db_mongo

    def search_experiences(
        self,
        destination: str,
        experience_type: Optional[str] = None,
        start_date: Optional[str] = None,
        duration_days: Optional[int] = None,
        participants: int = 1,
        filters: Optional[Dict[str, Any]] = None
    ) -> ServiceResult:
        """
        Search for experiences

        Args:
            destination: Destination (country, city, or region)
            experience_type: Type (safari, tour, activity, etc.)
            start_date: Preferred start date
            duration_days: Duration in days
            participants: Number of participants
            filters: Additional filters (price, difficulty, etc.)

        Returns:
            ServiceResult containing experience options
        """
        try:
            # Build query
            query = {'destination': destination}

            if experience_type:
                query['type'] = experience_type

            if duration_days:
                query['duration_days'] = duration_days

            # Query MongoDB experiences collection
            experiences = list(
                self.db_mongo.experiences.find(query).limit(50)
            )

            # Format results
            formatted = []
            for exp in experiences:
                exp['_id'] = str(exp['_id'])

                # Calculate total price
                exp['total_price'] = exp['price_per_person'] * participants

                formatted.append(exp)

            # Apply filters
            if filters:
                formatted = self._apply_filters(formatted, filters)

            return self.success(
                data={'experiences': formatted},
                message=f"Found {len(formatted)} experiences"
            )

        except Exception as e:
            self.logger.error(f"Experience search failed: {str(e)}")
            return self.error('SEARCH_FAILED', 'Failed to search experiences')

    def book_experience(
        self,
        experience_id: str,
        start_date: str,
        participants: List[Dict[str, Any]],
        special_requests: Optional[str],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Book an experience

        Args:
            experience_id: Experience ID
            start_date: Start date
            participants: Participant details
            special_requests: Special requests
            organization_id: DMC organization ID
            user_id: User creating booking

        Returns:
            ServiceResult containing booking confirmation
        """
        try:
            from bson import ObjectId

            # Get experience details
            experience = self.db_mongo.experiences.find_one({
                '_id': ObjectId(experience_id)
            })

            if not experience:
                return self.error('NOT_FOUND', 'Experience not found')

            # Calculate total price
            total_price = (
                experience['price_per_person'] * len(participants)
            )

            # Create booking
            booking_doc = {
                'type': 'experience',
                'experience_id': experience_id,
                'experience_name': experience['name'],
                'booking_reference': f"EXP{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                'status': 'confirmed',
                'start_date': start_date,
                'participants': participants,
                'special_requests': special_requests,
                'total_price': total_price,
                'currency': experience['currency'],
                'organization_id': organization_id,
                'user_id': user_id,
                'created_at': datetime.utcnow()
            }

            result = self.db_mongo.experience_bookings.insert_one(booking_doc)

            return self.success(
                data={
                    'booking_id': str(result.inserted_id),
                    'booking_reference': booking_doc['booking_reference'],
                    'status': 'confirmed',
                    'total_price': total_price
                },
                message='Experience booked successfully'
            )

        except Exception as e:
            self.logger.error(f"Experience booking failed: {str(e)}")
            return self.error('BOOKING_FAILED', 'Failed to book experience')

    def _apply_filters(
        self,
        experiences: List[Dict],
        filters: Dict[str, Any]
    ) -> List[Dict]:
        """Apply filters to experience results"""
        filtered = experiences

        # Price range filter
        if 'price_range' in filters:
            price_range = filters['price_range']
            filtered = [
                e for e in filtered
                if price_range.get('min', 0) <= e['price_per_person'] <= price_range.get('max', float('inf'))
            ]

        # Difficulty filter
        if 'difficulty' in filters:
            filtered = [
                e for e in filtered
                if e.get('difficulty') in filters['difficulty']
            ]

        return filtered
```

---

## Booking Service

**File**: `app/services/booking_service.py`

### Purpose
Orchestrates complete trip bookings across multiple services.

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult
from app.services.flight_service import FlightService
from app.services.hotel_service import HotelService
from app.services.transport_service import TransportService
from app.services.experience_service import ExperienceService


class BookingService(BaseService):
    """
    Booking Service

    Responsibilities:
    - Create complete trip bookings
    - Orchestrate multiple services
    - Calculate total pricing
    - Manage booking lifecycle
    - Generate booking documents
    """

    def __init__(
        self,
        flight_service: FlightService,
        hotel_service: HotelService,
        transport_service: TransportService,
        experience_service: ExperienceService,
        db_mongo
    ):
        super().__init__()
        self.flight_service = flight_service
        self.hotel_service = hotel_service
        self.transport_service = transport_service
        self.experience_service = experience_service
        self.db_mongo = db_mongo

    def create_booking(
        self,
        traveler_id: str,
        trip: Dict[str, Any],
        services: Dict[str, List[Dict]],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Create a complete trip booking

        Args:
            traveler_id: Traveler ID
            trip: Trip details (title, dates, destination)
            services: Services to book (flights, hotels, transport, experiences)
            organization_id: DMC organization ID
            user_id: User creating booking

        Returns:
            ServiceResult containing complete booking

        Example:
            >>> booking_service.create_booking(
            ...     traveler_id="tvl_abc123",
            ...     trip={
            ...         "title": "Kenya Safari Adventure",
            ...         "start_date": "2025-02-15",
            ...         "end_date": "2025-02-25"
            ...     },
            ...     services={
            ...         "flights": [...],
            ...         "hotels": [...],
            ...         "experiences": [...]
            ...     },
            ...     organization_id="org_abc123",
            ...     user_id="usr_xyz789"
            ... )
        """
        try:
            # Generate booking code
            booking_code = self._generate_booking_code()

            # Initialize booking document
            booking_doc = {
                'booking_code': booking_code,
                'organization_id': organization_id,
                'user_id': user_id,
                'traveler_id': traveler_id,
                'trip': trip,
                'services': {
                    'flights': [],
                    'hotels': [],
                    'transport': [],
                    'experiences': []
                },
                'pricing': {
                    'services': {},
                    'subtotal': 0.0,
                    'taxes': 0.0,
                    'fees': 0.0,
                    'total': 0.0,
                    'currency': 'USD'
                },
                'payment': {
                    'status': 'pending',
                    'paid_amount': 0.0,
                    'outstanding': 0.0
                },
                'status': 'pending',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            # Book flights
            if services.get('flights'):
                for flight in services['flights']:
                    # Store flight details
                    booking_doc['services']['flights'].append(flight)
                    booking_doc['pricing']['services']['flights'] = \
                        booking_doc['pricing']['services'].get('flights', 0) + flight.get('price', 0)

            # Book hotels
            if services.get('hotels'):
                for hotel in services['hotels']:
                    booking_doc['services']['hotels'].append(hotel)
                    booking_doc['pricing']['services']['hotels'] = \
                        booking_doc['pricing']['services'].get('hotels', 0) + hotel.get('price', 0)

            # Book transport
            if services.get('transport'):
                for transport in services['transport']:
                    booking_doc['services']['transport'].append(transport)
                    booking_doc['pricing']['services']['transport'] = \
                        booking_doc['pricing']['services'].get('transport', 0) + transport.get('price', 0)

            # Book experiences
            if services.get('experiences'):
                for experience in services['experiences']:
                    booking_doc['services']['experiences'].append(experience)
                    booking_doc['pricing']['services']['experiences'] = \
                        booking_doc['pricing']['services'].get('experiences', 0) + experience.get('price', 0)

            # Calculate total pricing
            subtotal = sum(booking_doc['pricing']['services'].values())
            taxes = subtotal * 0.10  # 10% taxes (example)
            fees = 50.00  # Booking fee (example)
            total = subtotal + taxes + fees

            booking_doc['pricing']['subtotal'] = subtotal
            booking_doc['pricing']['taxes'] = taxes
            booking_doc['pricing']['fees'] = fees
            booking_doc['pricing']['total'] = total
            booking_doc['payment']['outstanding'] = total

            # Insert into MongoDB
            result = self.db_mongo.bookings.insert_one(booking_doc)

            # Convert ObjectId to string
            booking_doc['_id'] = str(result.inserted_id)

            return self.success(
                data=booking_doc,
                message='Booking created successfully'
            )

        except Exception as e:
            self.logger.error(f"Create booking failed: {str(e)}")
            return self.error('CREATE_FAILED', 'Failed to create booking')

    def get_booking(
        self,
        booking_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Get booking details"""
        try:
            from bson import ObjectId

            booking = self.db_mongo.bookings.find_one({
                '_id': ObjectId(booking_id),
                'organization_id': organization_id
            })

            if not booking:
                return self.error('NOT_FOUND', 'Booking not found')

            booking['_id'] = str(booking['_id'])

            return self.success(data=booking)

        except Exception as e:
            self.logger.error(f"Get booking failed: {str(e)}")
            return self.error('GET_FAILED', 'Failed to retrieve booking')

    def update_booking(
        self,
        booking_id: str,
        updates: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """Update booking"""
        try:
            from bson import ObjectId

            updates['updated_at'] = datetime.utcnow()

            result = self.db_mongo.bookings.update_one(
                {
                    '_id': ObjectId(booking_id),
                    'organization_id': organization_id
                },
                {'$set': updates}
            )

            if result.matched_count == 0:
                return self.error('NOT_FOUND', 'Booking not found')

            return self.get_booking(booking_id, organization_id)

        except Exception as e:
            self.logger.error(f"Update booking failed: {str(e)}")
            return self.error('UPDATE_FAILED', 'Failed to update booking')

    def cancel_booking(
        self,
        booking_id: str,
        reason: str,
        organization_id: str
    ) -> ServiceResult:
        """Cancel booking"""
        # Cancel all individual services
        # Update booking status
        # Calculate refund amount
        pass

    def _generate_booking_code(self) -> str:
        """Generate unique booking code"""
        import random
        import string

        year = datetime.utcnow().year
        random_part = ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )

        return f"TW-{year}-{random_part}"
```

---

## Traveler Service

**File**: `app/services/traveler_service.py`

### Purpose
Manages traveler profiles and information.

### Class Definition

```python
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult


class TravelerService(BaseService):
    """
    Traveler Service

    Responsibilities:
    - Create traveler profiles
    - Update traveler information
    - Manage passport details
    - Track travel history
    - Manage preferences
    """

    def __init__(self, db_mongo):
        super().__init__()
        self.db_mongo = db_mongo

    def create_traveler(
        self,
        traveler_data: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """
        Create a new traveler profile

        Args:
            traveler_data: Traveler information
            organization_id: DMC organization ID

        Returns:
            ServiceResult containing created traveler
        """
        try:
            # Validate required fields
            self.validate_required_fields(traveler_data, [
                'name', 'email'
            ])

            # Check for duplicate email
            existing = self.db_mongo.travelers.find_one({
                'email': traveler_data['email'],
                'organization_id': organization_id
            })

            if existing:
                return self.error(
                    'DUPLICATE_EMAIL',
                    'Traveler with this email already exists'
                )

            # Create traveler document
            traveler_doc = {
                **traveler_data,
                'organization_id': organization_id,
                'travel_history': [],
                'total_bookings': 0,
                'total_spent': 0.0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            result = self.db_mongo.travelers.insert_one(traveler_doc)
            traveler_doc['_id'] = str(result.inserted_id)

            return self.success(
                data=traveler_doc,
                message='Traveler created successfully'
            )

        except Exception as e:
            self.logger.error(f"Create traveler failed: {str(e)}")
            return self.error('CREATE_FAILED', 'Failed to create traveler')

    def get_traveler(
        self,
        traveler_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Get traveler details"""
        try:
            from bson import ObjectId

            traveler = self.db_mongo.travelers.find_one({
                '_id': ObjectId(traveler_id),
                'organization_id': organization_id
            })

            if not traveler:
                return self.error('NOT_FOUND', 'Traveler not found')

            traveler['_id'] = str(traveler['_id'])

            return self.success(data=traveler)

        except Exception as e:
            self.logger.error(f"Get traveler failed: {str(e)}")
            return self.error('GET_FAILED', 'Failed to retrieve traveler')

    def update_traveler(
        self,
        traveler_id: str,
        updates: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """Update traveler information"""
        try:
            from bson import ObjectId

            updates['updated_at'] = datetime.utcnow()

            result = self.db_mongo.travelers.update_one(
                {
                    '_id': ObjectId(traveler_id),
                    'organization_id': organization_id
                },
                {'$set': updates}
            )

            if result.matched_count == 0:
                return self.error('NOT_FOUND', 'Traveler not found')

            return self.get_traveler(traveler_id, organization_id)

        except Exception as e:
            self.logger.error(f"Update traveler failed: {str(e)}")
            return self.error('UPDATE_FAILED', 'Failed to update traveler')

    def delete_traveler(
        self,
        traveler_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Delete traveler"""
        try:
            from bson import ObjectId

            result = self.db_mongo.travelers.delete_one({
                '_id': ObjectId(traveler_id),
                'organization_id': organization_id
            })

            if result.deleted_count == 0:
                return self.error('NOT_FOUND', 'Traveler not found')

            return self.success(message='Traveler deleted successfully')

        except Exception as e:
            self.logger.error(f"Delete traveler failed: {str(e)}")
            return self.error('DELETE_FAILED', 'Failed to delete traveler')

    def list_travelers(
        self,
        organization_id: str,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None
    ) -> ServiceResult:
        """List all travelers for organization"""
        try:
            query = {'organization_id': organization_id}

            # Add search filter
            if search:
                query['$or'] = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}}
                ]

            # Get total count
            total = self.db_mongo.travelers.count_documents(query)

            # Get paginated results
            skip = (page - 1) * per_page
            travelers = list(
                self.db_mongo.travelers.find(query)
                .skip(skip)
                .limit(per_page)
                .sort('created_at', -1)
            )

            # Convert ObjectIds
            for traveler in travelers:
                traveler['_id'] = str(traveler['_id'])

            return self.success(
                data={
                    'travelers': travelers,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total,
                        'total_pages': (total + per_page - 1) // per_page
                    }
                }
            )

        except Exception as e:
            self.logger.error(f"List travelers failed: {str(e)}")
            return self.error('LIST_FAILED', 'Failed to list travelers')
```

---

## Payment Service

**File**: `app/services/payment_service.py`

### Purpose
Handles payment processing and tracking.

### Class Definition

```python
from typing import Dict, Any, Optional
from datetime import datetime
from app.services.base import BaseService, ServiceResult


class PaymentService(BaseService):
    """
    Payment Service

    Responsibilities:
    - Record payments
    - Track payment status
    - Generate payment schedules
    - Process refunds
    - Payment method management
    """

    def __init__(self, db_mongo):
        super().__init__()
        self.db_mongo = db_mongo

    def record_payment(
        self,
        booking_id: str,
        amount: float,
        payment_method: str,
        transaction_id: Optional[str],
        notes: Optional[str],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Record a payment

        Args:
            booking_id: Booking ID
            amount: Payment amount
            payment_method: Payment method (credit_card, bank_transfer, etc.)
            transaction_id: External transaction ID
            notes: Payment notes
            organization_id: DMC organization ID
            user_id: User recording payment

        Returns:
            ServiceResult containing payment record
        """
        try:
            # Create payment document
            payment_doc = {
                'booking_id': booking_id,
                'amount': amount,
                'currency': 'USD',
                'payment_method': payment_method,
                'transaction_id': transaction_id,
                'status': 'completed',
                'notes': notes,
                'organization_id': organization_id,
                'user_id': user_id,
                'payment_date': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }

            result = self.db_mongo.payments.insert_one(payment_doc)

            # Update booking payment status
            from bson import ObjectId
            booking = self.db_mongo.bookings.find_one({
                '_id': ObjectId(booking_id)
            })

            if booking:
                new_paid = booking['payment']['paid_amount'] + amount
                new_outstanding = booking['pricing']['total'] - new_paid

                payment_status = 'paid' if new_outstanding <= 0 else 'partial'

                self.db_mongo.bookings.update_one(
                    {'_id': ObjectId(booking_id)},
                    {
                        '$set': {
                            'payment.paid_amount': new_paid,
                            'payment.outstanding': new_outstanding,
                            'payment.status': payment_status
                        }
                    }
                )

            payment_doc['_id'] = str(result.inserted_id)

            return self.success(
                data=payment_doc,
                message='Payment recorded successfully'
            )

        except Exception as e:
            self.logger.error(f"Record payment failed: {str(e)}")
            return self.error('RECORD_FAILED', 'Failed to record payment')
```

---

## Notification Service

**File**: `app/services/notification_service.py`

### Purpose
Handles email and SMS notifications.

### Class Definition

```python
from typing import Dict, Any, List
from app.services.base import BaseService, ServiceResult


class NotificationService(BaseService):
    """
    Notification Service

    Responsibilities:
    - Send booking confirmations
    - Send payment receipts
    - Send trip reminders
    - Email template management
    - SMS notifications
    """

    def __init__(self, email_client, sms_client, db_sqlite):
        super().__init__()
        self.email_client = email_client
        self.sms_client = sms_client
        self.db_sqlite = db_sqlite

    def send_booking_confirmation(
        self,
        booking_id: str,
        recipient_email: str
    ) -> ServiceResult:
        """Send booking confirmation email"""
        try:
            # Get email template from SQLite
            template = self._get_template('booking_confirmation')

            # Render template with booking data
            html_content = self._render_template(template, {
                'booking_id': booking_id
            })

            # Send email
            self.email_client.send(
                to=recipient_email,
                subject="Booking Confirmation",
                html=html_content
            )

            return self.success(message='Confirmation email sent')

        except Exception as e:
            self.logger.error(f"Send confirmation failed: {str(e)}")
            return self.error('SEND_FAILED', 'Failed to send confirmation')

    def _get_template(self, template_name: str) -> Dict[str, Any]:
        """Get email template from SQLite"""
        cursor = self.db_sqlite.execute(
            "SELECT * FROM email_templates WHERE name = ?",
            (template_name,)
        )
        return cursor.fetchone()

    def _render_template(
        self,
        template: Dict[str, Any],
        data: Dict[str, Any]
    ) -> str:
        """Render email template with data"""
        # Template rendering logic
        pass
```

---

## WeaverAssistant Service

**File**: `app/services/weaver_assistant_service.py`

### Purpose
AI orchestration service that coordinates intent classification and workflow execution.

### Class Definition

```python
from typing import Dict, Any
from app.services.base import BaseService, ServiceResult
from app.ai.hybrid import HybridConversationManager


class WeaverAssistantService(BaseService):
    """
    WeaverAssistant Service

    Responsibilities:
    - Orchestrate AI conversation flow
    - Route intents to appropriate services
    - Manage conversation context
    - Generate natural language responses
    """

    def __init__(
        self,
        hybrid_manager: HybridConversationManager
    ):
        super().__init__()
        self.hybrid_manager = hybrid_manager

    async def handle_message(
        self,
        message: str,
        conversation_id: str,
        user_id: str,
        organization_id: str,
        mode: str = 'dmc'
    ) -> ServiceResult:
        """
        Handle user message through hybrid AI architecture

        Args:
            message: User message
            conversation_id: Conversation ID
            user_id: User ID
            organization_id: Organization ID
            mode: Mode (dmc or traveler)

        Returns:
            ServiceResult containing AI response and data
        """
        try:
            result = await self.hybrid_manager.handle_message(
                message=message,
                conversation_id=conversation_id,
                user_id=user_id,
                organization_id=organization_id
            )

            return self.success(
                data=result,
                message='Message processed successfully'
            )

        except Exception as e:
            self.logger.error(f"Handle message failed: {str(e)}")
            return self.error(
                'PROCESSING_FAILED',
                'Failed to process message'
            )
```

---

## Error Handling

### Service Error Types

```python
class ServiceError(Exception):
    """Base service error"""
    pass

class ValidationError(ServiceError):
    """Validation failed"""
    pass

class NotFoundError(ServiceError):
    """Resource not found"""
    pass

class DuplicateError(ServiceError):
    """Duplicate resource"""
    pass

class ExternalAPIError(ServiceError):
    """External API call failed"""
    pass
```

---

## Testing Strategy

### Unit Testing

Each service should have comprehensive unit tests:

```python
# tests/services/test_flight_service.py

def test_search_flights_success():
    """Test successful flight search"""
    service = FlightService(mock_amadeus, mock_sqlite, mock_mongo)

    result = service.search_flights({
        'origin': 'New York',
        'destination': 'Nairobi',
        'departure_date': '2025-02-15',
        'adults': 2
    })

    assert result['success'] == True
    assert len(result['data']['offers']) > 0


def test_search_flights_validation_error():
    """Test flight search with missing fields"""
    service = FlightService(mock_amadeus, mock_sqlite, mock_mongo)

    result = service.search_flights({
        'origin': 'New York'
        # Missing required fields
    })

    assert result['success'] == False
    assert result['error'] == 'VALIDATION_ERROR'
```

### Integration Testing

Test service interactions:

```python
def test_create_booking_with_all_services():
    """Test complete booking creation"""
    booking_service = BookingService(
        flight_service,
        hotel_service,
        transport_service,
        experience_service,
        db_mongo
    )

    result = booking_service.create_booking(...)

    assert result['success'] == True
    assert result['data']['booking_code'].startswith('TW-')
```

---

**End of Service Layer Design**

This document defines all service interfaces with clear method signatures, parameters, and return types. All services follow consistent patterns for testability and maintainability.
