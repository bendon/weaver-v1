"""
Flight Search Automation
Your algorithm for searching and filtering flights
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus


class FlightSearchAutomation(BaseAutomation):
    """
    Searches for flights based on user requirements
    This is YOUR algorithm - integrates with Amadeus or your flight database
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute flight search automation
        """
        # Validate required entities
        error = self.validate_entities(entities, ["destination"])
        if error:
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message=error,
                template="error"
            )

        # Extract search parameters
        destination = entities.get("destination")
        destination_name = entities.get("destination_name", destination)
        origin = entities.get("origin") or context.get("user_airport", "NBO")  # Default Nairobi
        origin_name = entities.get("origin_name", origin)
        date = self._parse_date(entities)
        travelers_count = entities.get("travelers_count", 1)
        time_preference = entities.get("time_preference")
        flight_class = entities.get("class", "economy")
        direct_only = entities.get("direct_only", False)

        # TODO: Call Amadeus API or your flight database
        # For now, return mock data to demonstrate the flow
        flights = self._search_flights(
            origin=origin,
            destination=destination,
            date=date,
            travelers=travelers_count,
            time_preference=time_preference,
            flight_class=flight_class,
            direct_only=direct_only
        )

        if not flights:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"No flights found from {origin_name} to {destination_name} on {date}",
                template="no_results"
            )

        # Format results with template
        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            data={
                "flights": flights,
                "search_params": {
                    "origin": origin,
                    "origin_name": origin_name,
                    "destination": destination,
                    "destination_name": destination_name,
                    "date": date,
                    "travelers": travelers_count,
                    "class": flight_class
                }
            },
            message=f"Found {len(flights)} flights from {origin_name} to {destination_name} on {date}",
            template="flight_results",
            actions=[
                {
                    "type": "button",
                    "label": "Book Selected Flight",
                    "action": "book_flight"
                },
                {
                    "type": "button",
                    "label": "Modify Search",
                    "action": "modify_search"
                }
            ]
        )

    def _parse_date(self, entities: Dict[str, Any]) -> str:
        """
        Parse date from entities
        Handles relative dates like 'tomorrow', 'next week'
        """
        relative_date = entities.get("relative_date")

        if relative_date == "tomorrow":
            date = datetime.now() + timedelta(days=1)
        elif relative_date == "today":
            date = datetime.now()
        elif relative_date == "next_week":
            date = datetime.now() + timedelta(days=7)
        else:
            # Default to tomorrow if no date specified
            date = datetime.now() + timedelta(days=1)

        return date.strftime("%Y-%m-%d")

    def _search_flights(
        self,
        origin: str,
        destination: str,
        date: str,
        travelers: int,
        time_preference: str = None,
        flight_class: str = "economy",
        direct_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Your flight search algorithm
        TODO: Replace with actual Amadeus API call or database query
        """
        # Mock flight data for demonstration
        all_flights = [
            {
                "id": "KQ761",
                "airline": "Kenya Airways",
                "flight_number": "KQ 761",
                "departure_time": "11:45",
                "arrival_time": "16:20",
                "duration": "4h 35m",
                "stops": 0,
                "price": 245 * travelers,
                "currency": "USD",
                "class": flight_class,
                "available_seats": 12
            },
            {
                "id": "SA308",
                "airline": "South African Airways",
                "flight_number": "SA 308",
                "departure_time": "12:30",
                "arrival_time": "17:05",
                "duration": "4h 35m",
                "stops": 0,
                "price": 198 * travelers,
                "currency": "USD",
                "class": flight_class,
                "available_seats": 8
            },
            {
                "id": "ET401",
                "airline": "Ethiopian Airlines",
                "flight_number": "ET 401",
                "departure_time": "08:15",
                "arrival_time": "14:45",
                "duration": "6h 30m",
                "stops": 1,
                "price": 165 * travelers,
                "currency": "USD",
                "class": flight_class,
                "available_seats": 20
            }
        ]

        # Filter by time preference
        if time_preference == "morning":
            all_flights = [f for f in all_flights if int(f["departure_time"].split(":")[0]) < 12]
        elif time_preference == "afternoon":
            all_flights = [f for f in all_flights if 12 <= int(f["departure_time"].split(":")[0]) < 18]
        elif time_preference == "evening":
            all_flights = [f for f in all_flights if int(f["departure_time"].split(":")[0]) >= 18]

        # Filter direct only
        if direct_only:
            all_flights = [f for f in all_flights if f["stops"] == 0]

        # Sort by price
        all_flights.sort(key=lambda x: x["price"])

        return all_flights[:5]  # Return top 5 results
