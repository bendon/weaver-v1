"""
Hotel Service - Deterministic Business Logic
Handles all hotel-related operations without AI
"""
from typing import Optional, List, Dict, Any

from app.services.base import (
    BaseService,
    ValidationError,
    ServiceError,
    HotelSearchParams,
    ServiceResult
)
from app.amadeus_client import AmadeusClient
from app.core.database import create_hotel


class HotelService(BaseService):
    """
    Hotel service for searching and booking hotels
    All operations are deterministic - no AI involved
    """

    def __init__(self, amadeus_client: Optional[AmadeusClient] = None):
        super().__init__()
        self.amadeus_client = amadeus_client

    def search(self, params: HotelSearchParams) -> ServiceResult:
        """
        Search for hotels using deterministic business logic

        Args:
            params: Hotel search parameters

        Returns:
            ServiceResult with list of hotel offers
        """
        try:
            # Validate inputs
            self._validate_search_params(params)

            # Check if Amadeus client is available
            if not self.amadeus_client:
                return self.error("Hotel search is not configured. Please set Amadeus API credentials.")

            # Call Amadeus API (deterministic)
            results = self.amadeus_client.search_hotels(
                city_code=params['city_code'],
                check_in_date=params['check_in_date'],
                check_out_date=params['check_out_date'],
                adults=params.get('adults', 1),
                rooms=params.get('rooms', 1),
                radius=params.get('radius', 5)
            )

            # Format results (deterministic)
            hotels = self._format_hotel_offers(results)

            return self.success(
                data=hotels,
                message=f"Found {len(hotels)} hotel options"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Hotel search failed: {str(e)}")

    def add_to_booking(
        self,
        booking_id: str,
        hotel_name: str,
        check_in_date: str,
        check_out_date: str,
        city: Optional[str] = None,
        country: Optional[str] = None,
        address: Optional[str] = None,
        price: Optional[float] = None,
        currency: str = "USD"
    ) -> ServiceResult:
        """
        Add a hotel to an existing booking
        Pure business logic - no AI

        Args:
            booking_id: ID of the booking
            hotel_name: Name of the hotel
            check_in_date: Check-in date (YYYY-MM-DD)
            check_out_date: Check-out date (YYYY-MM-DD)
            city: City name
            country: Country name
            address: Hotel address
            price: Total price
            currency: Currency code

        Returns:
            ServiceResult with created hotel ID
        """
        try:
            # Validate dates
            self.validate_date(check_in_date, 'Check-in date')
            self.validate_date(check_out_date, 'Check-out date')
            self.validate_date_range(check_in_date, check_out_date)

            # Create hotel in database
            hotel_id = create_hotel(
                booking_id=booking_id,
                hotel_name=hotel_name,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                city=city,
                country=country,
                address=address,
                price=price,
                currency=currency
            )

            if not hotel_id:
                return self.error("Failed to add hotel to booking")

            return self.success(
                data={"hotel_id": hotel_id},
                message=f"Hotel '{hotel_name}' added to booking successfully"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Failed to add hotel: {str(e)}")

    def _validate_search_params(self, params: HotelSearchParams) -> None:
        """Validate hotel search parameters"""
        # Required fields
        self.validate_required_fields(params, ['city_code', 'check_in_date', 'check_out_date'])

        # Validate dates
        self.validate_date(params['check_in_date'], 'Check-in date')
        self.validate_date(params['check_out_date'], 'Check-out date')
        self.validate_date_range(params['check_in_date'], params['check_out_date'])

        # Validate counts
        if params.get('adults') and params['adults'] < 1:
            raise ValidationError("Number of adults must be at least 1")
        if params.get('rooms') and params['rooms'] < 1:
            raise ValidationError("Number of rooms must be at least 1")

    def _format_hotel_offers(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Format Amadeus results into hotel objects"""
        hotels = results.get("data", [])
        formatted_hotels = []

        for hotel in hotels[:10]:  # Limit to top 10
            formatted_hotels.append({
                "hotel_id": hotel.get("hotel", {}).get("hotelId"),
                "name": hotel.get("hotel", {}).get("name", "Unknown Hotel"),
                "chain_code": hotel.get("hotel", {}).get("chainCode"),
                "rating": hotel.get("hotel", {}).get("rating"),
                "city_code": hotel.get("hotel", {}).get("cityCode"),
                "latitude": hotel.get("hotel", {}).get("latitude"),
                "longitude": hotel.get("hotel", {}).get("longitude"),
                "distance": hotel.get("hotel", {}).get("distance"),
                "full_data": hotel
            })

        return formatted_hotels
