"""
Flight Service - Deterministic Business Logic
Handles all flight-related operations without AI
"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.services.base import (
    BaseService,
    ValidationError,
    ServiceError,
    FlightSearchParams,
    FlightOffer,
    ServiceResult
)
from app.amadeus_client import AmadeusClient
from app.core.database import create_flight, get_connection


class FlightService(BaseService):
    """
    Flight service for searching and booking flights
    All operations are deterministic - no AI involved
    """

    def __init__(self, amadeus_client: Optional[AmadeusClient] = None):
        super().__init__()
        self.amadeus_client = amadeus_client

    def search(self, params: FlightSearchParams) -> ServiceResult:
        """
        Search for flights using deterministic business logic

        Args:
            params: Flight search parameters

        Returns:
            ServiceResult with list of FlightOffer objects
        """
        try:
            # Validate inputs (deterministic)
            self._validate_search_params(params)

            # Check if Amadeus client is available
            if not self.amadeus_client:
                return self.error("Flight search is not configured. Please set Amadeus API credentials.")

            # Convert city names to IATA codes (deterministic lookup)
            origin = self._get_iata_code(params['origin'])
            destination = self._get_iata_code(params['destination'])

            if not origin:
                return self.error(f"Could not find airport code for origin: {params['origin']}")
            if not destination:
                return self.error(f"Could not find airport code for destination: {params['destination']}")

            # Call Amadeus API (deterministic)
            results = self.amadeus_client.search_flights(
                origin=origin,
                destination=destination,
                departure_date=params['departure_date'],
                return_date=params.get('return_date'),
                adults=params.get('adults', 1),
                max_results=params.get('max_results', 5)
            )

            # Format results (deterministic)
            offers = self._format_flight_offers(results, params.get('max_results', 5))

            return self.success(
                data=offers,
                message=f"Found {len(offers)} flight options"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Flight search failed: {str(e)}")

    def add_to_booking(
        self,
        booking_id: str,
        carrier_code: str,
        flight_number: str,
        departure_airport: str,
        arrival_airport: str,
        scheduled_departure: str,
        scheduled_arrival: str,
        flight_type: str = "outbound",
        airline_name: Optional[str] = None
    ) -> ServiceResult:
        """
        Add a flight to an existing booking
        Pure business logic - no AI

        Args:
            booking_id: ID of the booking
            carrier_code: Airline carrier code
            flight_number: Flight number
            departure_airport: Departure airport IATA code
            arrival_airport: Arrival airport IATA code
            scheduled_departure: Departure datetime (ISO format)
            scheduled_arrival: Arrival datetime (ISO format)
            flight_type: Type of flight (outbound, return, internal)
            airline_name: Full airline name

        Returns:
            ServiceResult with created flight ID
        """
        try:
            # Extract date from datetime
            departure_date = scheduled_departure.split('T')[0]

            # Create flight in database
            flight_id = create_flight(
                booking_id=booking_id,
                carrier_code=carrier_code,
                flight_number=flight_number,
                departure_date=departure_date,
                departure_airport=departure_airport,
                arrival_airport=arrival_airport,
                scheduled_departure=scheduled_departure,
                scheduled_arrival=scheduled_arrival,
                flight_type=flight_type,
                airline_name=airline_name,
                status="confirmed"
            )

            if not flight_id:
                return self.error("Failed to add flight to booking")

            return self.success(
                data={"flight_id": flight_id},
                message="Flight added to booking successfully"
            )

        except Exception as e:
            return self.error(f"Failed to add flight: {str(e)}")

    def _validate_search_params(self, params: FlightSearchParams) -> None:
        """Validate flight search parameters"""
        # Required fields
        self.validate_required_fields(params, ['origin', 'destination', 'departure_date'])

        # Validate departure date
        self.validate_date(params['departure_date'], 'Departure date')

        # Validate return date if provided
        if params.get('return_date'):
            self.validate_date(params['return_date'], 'Return date')
            self.validate_date_range(params['departure_date'], params['return_date'])

        # Validate adults count
        if params.get('adults') and params['adults'] < 1:
            raise ValidationError("Number of adults must be at least 1")

    def _get_iata_code(self, location: str) -> Optional[str]:
        """
        Convert city name or IATA code to IATA code
        Deterministic lookup - no AI
        """
        location = location.strip()

        # Check if it's already a valid IATA code (3 uppercase letters)
        if len(location) == 3 and location.isupper() and location.isalpha():
            return location

        # Try to find IATA code from local database
        try:
            conn = get_connection()
            cursor = conn.cursor()

            name_lower = location.lower()
            name_upper = location.upper()

            cursor.execute("""
                SELECT iata_code
                FROM airports
                WHERE
                    LOWER(city) = ? OR
                    LOWER(city) LIKE ? OR
                    LOWER(name) LIKE ? OR
                    iata_code = ?
                ORDER BY
                    CASE WHEN LOWER(city) = ? THEN 1 ELSE 2 END,
                    CASE WHEN LOWER(name) LIKE ? THEN 1 ELSE 2 END
                LIMIT 1
            """, (
                name_lower,
                f"{name_lower}%",
                f"%{name_lower}%",
                name_upper,
                name_lower,
                f"{name_lower}%",
            ))

            row = cursor.fetchone()
            conn.close()

            if row:
                return row["iata_code"]
        except Exception as e:
            print(f"Error searching local database for airport: {e}")

        # Fall back to Amadeus if available
        if self.amadeus_client:
            try:
                result = self.amadeus_client.search_airports(location, sub_type="AIRPORT")
                locations = result.get("data", [])
                if locations:
                    iata_code = locations[0].get("iataCode")
                    if iata_code:
                        return iata_code

                result = self.amadeus_client.search_airports(location, sub_type="CITY")
                locations = result.get("data", [])
                if locations:
                    iata_code = locations[0].get("iataCode")
                    if iata_code:
                        return iata_code
            except Exception:
                pass

        return None

    def _format_flight_offers(self, results: Dict[str, Any], max_results: int) -> List[FlightOffer]:
        """Format Amadeus results into FlightOffer objects"""
        offers = results.get("data", [])
        formatted_offers = []

        for i, offer in enumerate(offers[:max_results]):
            itinerary = offer["itineraries"][0]
            segments = itinerary["segments"]
            first_segment = segments[0]
            last_segment = segments[-1]

            formatted_offers.append({
                "offer_id": offer["id"],
                "price": f"{offer['price']['total']} {offer['price']['currency']}",
                "route": f"{first_segment['departure']['iataCode']} → {last_segment['arrival']['iataCode']}",
                "departure": first_segment['departure']['at'],
                "arrival": last_segment['arrival']['at'],
                "duration": itinerary["duration"],
                "stops": len(segments) - 1,
                "carrier": first_segment.get("carrierCode"),
                "flight_number": first_segment.get("number"),
                "full_offer": offer
            })

        return formatted_offers
