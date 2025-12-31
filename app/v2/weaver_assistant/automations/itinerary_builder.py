"""
Itinerary Builder Automation
Your algorithm for building custom travel itineraries
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus


class ItineraryBuilderAutomation(BaseAutomation):
    """
    Builds custom travel itineraries based on user requirements
    This is YOUR algorithm - applies your DMC templates, packages, and local knowledge
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute itinerary building automation
        """
        # Extract itinerary parameters
        destination = entities.get("destination")
        destination_name = entities.get("destination_name", destination or "destination")
        duration_days = entities.get("duration_days", 7)
        trip_type = entities.get("trip_type", "general")
        interests = entities.get("interests", [])
        travelers_count = entities.get("travelers_count", 2)
        budget_level = entities.get("hotel_category", "standard")  # luxury, standard, budget

        # Validate we have minimum requirements
        if not destination and trip_type == "general":
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message="I need more details to build your itinerary. Which destination are you interested in? What type of trip? (safari, beach, city tour, adventure)",
                template="error"
            )

        # Build itinerary using your templates and algorithms
        itinerary = self._build_itinerary(
            destination=destination,
            destination_name=destination_name,
            duration_days=duration_days,
            trip_type=trip_type,
            interests=interests,
            travelers_count=travelers_count,
            budget_level=budget_level
        )

        # Calculate pricing
        pricing = self._calculate_pricing(itinerary, travelers_count, budget_level)

        # Format results with template
        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            data={
                "itinerary": itinerary,
                "pricing": pricing,
                "search_params": {
                    "destination": destination_name,
                    "duration": duration_days,
                    "trip_type": trip_type,
                    "travelers": travelers_count,
                    "budget_level": budget_level
                }
            },
            message=f"I've created a {duration_days}-day {trip_type} itinerary for {destination_name}",
            template="itinerary_results",
            requires_confirmation=True,
            next_step="review_and_confirm",
            actions=[
                {
                    "type": "button",
                    "label": "Confirm & Get Quote",
                    "action": "get_quote"
                },
                {
                    "type": "button",
                    "label": "Modify Itinerary",
                    "action": "modify_itinerary"
                },
                {
                    "type": "button",
                    "label": "Add Flights",
                    "action": "search_flight"
                },
                {
                    "type": "button",
                    "label": "Create Booking",
                    "action": "create_booking"
                }
            ]
        )

    def _build_itinerary(
        self,
        destination: str,
        destination_name: str,
        duration_days: int,
        trip_type: str,
        interests: List[str],
        travelers_count: int,
        budget_level: str
    ) -> Dict[str, Any]:
        """
        Your itinerary building algorithm
        TODO: Replace with your actual DMC templates and packages
        """
        # Select template based on trip type
        if trip_type == "safari":
            return self._build_safari_itinerary(destination_name, duration_days, budget_level)
        elif trip_type == "beach":
            return self._build_beach_itinerary(destination_name, duration_days, budget_level)
        elif trip_type == "city":
            return self._build_city_itinerary(destination_name, duration_days, budget_level)
        else:
            return self._build_general_itinerary(destination_name, duration_days, trip_type, interests, budget_level)

    def _build_safari_itinerary(self, destination: str, days: int, budget: str) -> Dict[str, Any]:
        """Build a safari itinerary template"""
        start_date = datetime.now() + timedelta(days=30)  # Default to 30 days from now

        itinerary_days = []

        # Day 1: Arrival
        itinerary_days.append({
            "day": 1,
            "date": (start_date).strftime("%Y-%m-%d"),
            "title": "Arrival & Welcome",
            "activities": [
                {
                    "time": "14:00",
                    "title": "Airport Pickup",
                    "description": "Meet and greet at airport, transfer to lodge",
                    "duration": "2 hours",
                    "included": True
                },
                {
                    "time": "16:00",
                    "title": "Lodge Check-in & Orientation",
                    "description": "Check into your safari lodge, welcome briefing",
                    "duration": "1 hour",
                    "included": True
                },
                {
                    "time": "18:00",
                    "title": "Sunset Welcome Dinner",
                    "description": "Traditional welcome dinner with local cuisine",
                    "duration": "2 hours",
                    "included": True
                }
            ],
            "accommodation": {
                "name": "Safari Lodge & Spa" if budget == "luxury" else "Standard Safari Camp",
                "type": budget,
                "meal_plan": "Dinner"
            }
        })

        # Middle days: Safari activities
        for i in range(2, days):
            itinerary_days.append({
                "day": i,
                "date": (start_date + timedelta(days=i-1)).strftime("%Y-%m-%d"),
                "title": f"Full Day Safari Adventure - Day {i-1}",
                "activities": [
                    {
                        "time": "06:00",
                        "title": "Morning Game Drive",
                        "description": "Early morning wildlife viewing when animals are most active",
                        "duration": "3 hours",
                        "included": True
                    },
                    {
                        "time": "09:00",
                        "title": "Breakfast",
                        "description": "Bush breakfast with scenic views",
                        "duration": "1 hour",
                        "included": True
                    },
                    {
                        "time": "10:00",
                        "title": "Leisure Time",
                        "description": "Rest at the lodge, optional spa treatments",
                        "duration": "4 hours",
                        "included": False
                    },
                    {
                        "time": "16:00",
                        "title": "Afternoon Game Drive",
                        "description": "Afternoon wildlife viewing and sundowner experience",
                        "duration": "3 hours",
                        "included": True
                    },
                    {
                        "time": "19:30",
                        "title": "Dinner",
                        "description": "Dinner at the lodge",
                        "duration": "1.5 hours",
                        "included": True
                    }
                ],
                "accommodation": {
                    "name": "Safari Lodge & Spa" if budget == "luxury" else "Standard Safari Camp",
                    "type": budget,
                    "meal_plan": "Full Board"
                }
            })

        # Last day: Departure
        itinerary_days.append({
            "day": days,
            "date": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
            "title": "Departure",
            "activities": [
                {
                    "time": "06:00",
                    "title": "Final Morning Game Drive",
                    "description": "Last chance to spot wildlife",
                    "duration": "2 hours",
                    "included": True
                },
                {
                    "time": "08:30",
                    "title": "Breakfast & Check-out",
                    "description": "Farewell breakfast and lodge check-out",
                    "duration": "1.5 hours",
                    "included": True
                },
                {
                    "time": "10:00",
                    "title": "Airport Transfer",
                    "description": "Transfer to airport for departure",
                    "duration": "2 hours",
                    "included": True
                }
            ],
            "accommodation": None
        })

        return {
            "title": f"{days}-Day Safari Adventure",
            "destination": destination,
            "duration_days": days,
            "duration_nights": days - 1,
            "trip_type": "safari",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
            "days": itinerary_days,
            "inclusions": [
                "Airport transfers",
                "Accommodation as specified",
                "All meals as per itinerary",
                "Daily game drives with professional guide",
                "Park entrance fees",
                "Bottled water during activities"
            ],
            "exclusions": [
                "International flights",
                "Visa fees",
                "Travel insurance",
                "Optional activities",
                "Personal expenses",
                "Tips and gratuities"
            ]
        }

    def _build_beach_itinerary(self, destination: str, days: int, budget: str) -> Dict[str, Any]:
        """Build a beach vacation itinerary"""
        start_date = datetime.now() + timedelta(days=30)

        itinerary_days = []

        for i in range(1, days + 1):
            if i == 1:
                title = "Arrival & Beach Relaxation"
                activities = [
                    {"time": "14:00", "title": "Resort Check-in", "description": "Check into beachfront resort", "duration": "1 hour", "included": True},
                    {"time": "16:00", "title": "Beach Welcome", "description": "Explore the beach and resort facilities", "duration": "2 hours", "included": True}
                ]
            elif i == days:
                title = "Departure"
                activities = [
                    {"time": "10:00", "title": "Check-out", "description": "Resort check-out", "duration": "1 hour", "included": True},
                    {"time": "12:00", "title": "Airport Transfer", "description": "Transfer to airport", "duration": "1 hour", "included": True}
                ]
            else:
                title = "Beach Day & Water Activities"
                activities = [
                    {"time": "09:00", "title": "Beach Time", "description": "Relax on pristine beaches", "duration": "3 hours", "included": True},
                    {"time": "14:00", "title": "Water Sports", "description": "Snorkeling, diving, or kayaking", "duration": "2 hours", "included": False},
                    {"time": "18:00", "title": "Sunset Experience", "description": "Sunset dhow cruise or beach walk", "duration": "2 hours", "included": False}
                ]

            itinerary_days.append({
                "day": i,
                "date": (start_date + timedelta(days=i-1)).strftime("%Y-%m-%d"),
                "title": title,
                "activities": activities,
                "accommodation": {
                    "name": "Beachfront Resort" if budget == "luxury" else "Beach Hotel",
                    "type": budget,
                    "meal_plan": "Half Board" if i < days else None
                } if i < days else None
            })

        return {
            "title": f"{days}-Day Beach Getaway",
            "destination": destination,
            "duration_days": days,
            "duration_nights": days - 1,
            "trip_type": "beach",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
            "days": itinerary_days,
            "inclusions": ["Accommodation", "Airport transfers", "Breakfast and dinner daily", "Beach access"],
            "exclusions": ["Flights", "Water sports", "Excursions", "Personal expenses"]
        }

    def _build_city_itinerary(self, destination: str, days: int, budget: str) -> Dict[str, Any]:
        """Build a city tour itinerary"""
        start_date = datetime.now() + timedelta(days=30)

        itinerary_days = []

        for i in range(1, days + 1):
            itinerary_days.append({
                "day": i,
                "date": (start_date + timedelta(days=i-1)).strftime("%Y-%m-%d"),
                "title": f"City Exploration - Day {i}",
                "activities": [
                    {"time": "09:00", "title": "City Tour", "description": "Guided tour of major attractions", "duration": "4 hours", "included": True},
                    {"time": "14:00", "title": "Cultural Experience", "description": "Museums, markets, or historical sites", "duration": "3 hours", "included": True},
                    {"time": "18:00", "title": "Evening at Leisure", "description": "Explore local dining and nightlife", "duration": "3 hours", "included": False}
                ],
                "accommodation": {
                    "name": "City Center Hotel",
                    "type": budget,
                    "meal_plan": "Bed & Breakfast"
                } if i < days else None
            })

        return {
            "title": f"{days}-Day City Tour",
            "destination": destination,
            "duration_days": days,
            "duration_nights": days - 1,
            "trip_type": "city",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
            "days": itinerary_days,
            "inclusions": ["Accommodation", "Daily breakfast", "Guided city tours", "Entrance fees"],
            "exclusions": ["Flights", "Lunch and dinner", "Optional activities", "Personal expenses"]
        }

    def _build_general_itinerary(
        self,
        destination: str,
        days: int,
        trip_type: str,
        interests: List[str],
        budget: str
    ) -> Dict[str, Any]:
        """Build a general itinerary based on interests"""
        # Default to a mixed itinerary if no specific type
        start_date = datetime.now() + timedelta(days=30)

        itinerary_days = []
        for i in range(1, days + 1):
            itinerary_days.append({
                "day": i,
                "date": (start_date + timedelta(days=i-1)).strftime("%Y-%m-%d"),
                "title": f"Day {i} - {destination}",
                "activities": [
                    {"time": "09:00", "title": "Morning Activity", "description": "Custom activity based on interests", "duration": "3 hours", "included": True},
                    {"time": "14:00", "title": "Afternoon Experience", "description": "Tailored to your preferences", "duration": "3 hours", "included": True}
                ],
                "accommodation": {
                    "name": "Selected Hotel",
                    "type": budget,
                    "meal_plan": "Half Board"
                } if i < days else None
            })

        return {
            "title": f"{days}-Day {trip_type.title()} Experience",
            "destination": destination,
            "duration_days": days,
            "duration_nights": days - 1,
            "trip_type": trip_type,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": (start_date + timedelta(days=days-1)).strftime("%Y-%m-%d"),
            "days": itinerary_days,
            "inclusions": ["Accommodation", "Selected meals", "Activities as specified"],
            "exclusions": ["Flights", "Optional activities", "Personal expenses"]
        }

    def _calculate_pricing(
        self,
        itinerary: Dict[str, Any],
        travelers: int,
        budget_level: str
    ) -> Dict[str, Any]:
        """
        Calculate itinerary pricing
        TODO: Replace with your actual pricing algorithm
        """
        # Base pricing per person per night
        pricing_table = {
            "luxury": {"safari": 450, "beach": 320, "city": 180, "general": 250},
            "standard": {"safari": 280, "beach": 180, "city": 120, "general": 150},
            "budget": {"safari": 150, "beach": 95, "city": 65, "general": 85}
        }

        trip_type = itinerary.get("trip_type", "general")
        nights = itinerary.get("duration_nights", 6)

        per_person_per_night = pricing_table.get(budget_level, pricing_table["standard"]).get(trip_type, 150)
        per_person_total = per_person_per_night * nights
        total = per_person_total * travelers

        return {
            "currency": "USD",
            "per_person": per_person_total,
            "total": total,
            "travelers": travelers,
            "nights": nights,
            "breakdown": {
                "accommodation": per_person_total * 0.6,
                "activities": per_person_total * 0.25,
                "meals": per_person_total * 0.10,
                "transfers": per_person_total * 0.05
            }
        }
