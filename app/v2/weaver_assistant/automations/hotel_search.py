"""
Hotel Search Automation
Your algorithm for searching and filtering hotels
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus


class HotelSearchAutomation(BaseAutomation):
    """
    Searches for hotels based on user requirements
    This is YOUR algorithm - integrates with Amadeus or your hotel database
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute hotel search automation
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
        check_in_date = self._parse_date(entities, "check_in")
        check_out_date = self._parse_date(entities, "check_out")
        guests_count = entities.get("travelers_count", 2)
        hotel_category = entities.get("hotel_category", "standard")
        amenities = entities.get("amenities", [])
        duration_days = entities.get("duration_days", 3)

        # If check_out not specified, calculate from duration
        if not check_out_date and check_in_date:
            check_in = datetime.strptime(check_in_date, "%Y-%m-%d")
            check_out = check_in + timedelta(days=duration_days)
            check_out_date = check_out.strftime("%Y-%m-%d")

        # TODO: Call Amadeus API or your hotel database
        # For now, return mock data to demonstrate the flow
        hotels = self._search_hotels(
            destination=destination,
            check_in=check_in_date,
            check_out=check_out_date,
            guests=guests_count,
            category=hotel_category,
            amenities=amenities
        )

        if not hotels:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"No hotels found in {destination_name} for {check_in_date} to {check_out_date}",
                template="no_results"
            )

        # Calculate nights
        nights = duration_days
        if check_in_date and check_out_date:
            check_in = datetime.strptime(check_in_date, "%Y-%m-%d")
            check_out = datetime.strptime(check_out_date, "%Y-%m-%d")
            nights = (check_out - check_in).days

        # Format results with template
        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            data={
                "hotels": hotels,
                "search_params": {
                    "destination": destination,
                    "destination_name": destination_name,
                    "check_in": check_in_date,
                    "check_out": check_out_date,
                    "guests": guests_count,
                    "nights": nights,
                    "category": hotel_category
                }
            },
            message=f"Found {len(hotels)} hotels in {destination_name} ({nights} nights)",
            template="hotel_results",
            actions=[
                {
                    "type": "button",
                    "label": "Book Selected Hotel",
                    "action": "book_hotel"
                },
                {
                    "type": "button",
                    "label": "Modify Search",
                    "action": "modify_search"
                },
                {
                    "type": "button",
                    "label": "Add Flights",
                    "action": "search_flight"
                }
            ]
        )

    def _parse_date(self, entities: Dict[str, Any], date_type: str = "check_in") -> str:
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
            # Default to tomorrow for check_in
            if date_type == "check_in":
                date = datetime.now() + timedelta(days=1)
            else:
                # Default check_out is 3 days after check_in
                date = datetime.now() + timedelta(days=4)

        return date.strftime("%Y-%m-%d")

    def _search_hotels(
        self,
        destination: str,
        check_in: str,
        check_out: str,
        guests: int,
        category: str = "standard",
        amenities: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Your hotel search algorithm
        TODO: Replace with actual Amadeus API call or database query
        """
        # Mock hotel data for demonstration
        all_hotels = [
            {
                "id": "HTL001",
                "name": "Safari Lodge & Spa",
                "category": "luxury",
                "rating": 4.8,
                "stars": 5,
                "price_per_night": 320,
                "currency": "USD",
                "total_price": 320 * self._calculate_nights(check_in, check_out),
                "amenities": ["pool", "spa", "wifi", "restaurant", "bar"],
                "location": "City Center",
                "distance_from_center": "0.5 km",
                "images": [],
                "available_rooms": 5,
                "room_type": "Deluxe Suite"
            },
            {
                "id": "HTL002",
                "name": "Ocean View Resort",
                "category": "luxury",
                "rating": 4.7,
                "stars": 5,
                "price_per_night": 285,
                "currency": "USD",
                "total_price": 285 * self._calculate_nights(check_in, check_out),
                "amenities": ["pool", "beach", "wifi", "restaurant", "gym"],
                "location": "Beachfront",
                "distance_from_center": "3.2 km",
                "images": [],
                "available_rooms": 8,
                "room_type": "Ocean View King"
            },
            {
                "id": "HTL003",
                "name": "City Center Hotel",
                "category": "standard",
                "rating": 4.2,
                "stars": 4,
                "price_per_night": 145,
                "currency": "USD",
                "total_price": 145 * self._calculate_nights(check_in, check_out),
                "amenities": ["wifi", "restaurant", "parking"],
                "location": "Downtown",
                "distance_from_center": "0.8 km",
                "images": [],
                "available_rooms": 12,
                "room_type": "Standard Double"
            },
            {
                "id": "HTL004",
                "name": "Budget Inn",
                "category": "budget",
                "rating": 3.8,
                "stars": 3,
                "price_per_night": 65,
                "currency": "USD",
                "total_price": 65 * self._calculate_nights(check_in, check_out),
                "amenities": ["wifi", "breakfast"],
                "location": "Suburb",
                "distance_from_center": "5.1 km",
                "images": [],
                "available_rooms": 15,
                "room_type": "Economy Room"
            },
            {
                "id": "HTL005",
                "name": "Boutique Garden Hotel",
                "category": "boutique",
                "rating": 4.6,
                "stars": 4,
                "price_per_night": 195,
                "currency": "USD",
                "total_price": 195 * self._calculate_nights(check_in, check_out),
                "amenities": ["pool", "wifi", "restaurant", "garden"],
                "location": "Garden District",
                "distance_from_center": "2.3 km",
                "images": [],
                "available_rooms": 6,
                "room_type": "Garden Suite"
            }
        ]

        # Filter by category
        if category and category != "standard":
            all_hotels = [h for h in all_hotels if h["category"] == category]

        # Filter by amenities if specified
        if amenities:
            filtered_hotels = []
            for hotel in all_hotels:
                if all(amenity in hotel["amenities"] for amenity in amenities):
                    filtered_hotels.append(hotel)
            all_hotels = filtered_hotels

        # Sort by rating and price
        all_hotels.sort(key=lambda x: (-x["rating"], x["price_per_night"]))

        return all_hotels[:5]  # Return top 5 results

    def _calculate_nights(self, check_in: str, check_out: str) -> int:
        """Calculate number of nights between check-in and check-out"""
        try:
            check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
            check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
            return max((check_out_date - check_in_date).days, 1)
        except:
            return 3  # Default to 3 nights
