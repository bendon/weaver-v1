"""
Intent Recognition System for WeaverAssistant
Understands user requests and extracts structured data
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    """Supported intent types"""
    # Booking related
    SEARCH_FLIGHT = "search_flight"
    SEARCH_HOTEL = "search_hotel"
    CREATE_BOOKING = "create_booking"
    VIEW_BOOKING = "view_booking"
    MODIFY_BOOKING = "modify_booking"
    CANCEL_BOOKING = "cancel_booking"

    # Traveler related
    CREATE_TRAVELER = "create_traveler"
    VIEW_TRAVELER = "view_traveler"
    UPDATE_TRAVELER = "update_traveler"

    # Information requests
    GET_DESTINATION_INFO = "get_destination_info"
    GET_PRICING = "get_pricing"
    GET_AVAILABILITY = "get_availability"

    # Itinerary related
    BUILD_ITINERARY = "build_itinerary"
    SUGGEST_ACTIVITIES = "suggest_activities"

    # General
    GREETING = "greeting"
    HELP = "help"
    UNKNOWN = "unknown"


class Intent(BaseModel):
    """Recognized intent with confidence"""
    type: IntentType
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entities")
    raw_query: str = Field(..., description="Original user query")


class IntentRecognizer:
    """
    Recognizes user intent from natural language
    Uses keyword matching + patterns (99% your algorithms)
    Only 1% AI for ambiguous cases
    """

    # Keyword patterns for each intent
    PATTERNS = {
        IntentType.SEARCH_FLIGHT: [
            "flight", "fly", "plane", "ticket", "airline"
        ],
        IntentType.SEARCH_HOTEL: [
            "hotel", "accommodation", "stay", "lodge", "resort"
        ],
        IntentType.CREATE_BOOKING: [
            "book", "reserve", "create booking", "make reservation"
        ],
        IntentType.VIEW_BOOKING: [
            "show booking", "view booking", "my booking", "booking details", "bookings"
        ],
        IntentType.VIEW_TRAVELER: [
            "travelers", "traveller", "show travelers", "list travelers", "find traveler"
        ],
        IntentType.GET_DESTINATION_INFO: [
            "tell me about", "information about", "what to do in", "best time to visit", "visit", "destination"
        ],
        IntentType.BUILD_ITINERARY: [
            "itinerary", "plan trip", "trip plan", "schedule", "safari"
        ],
        IntentType.GREETING: [
            "hello", "hi", "hey", "good morning", "good afternoon"
        ],
        IntentType.HELP: [
            "help", "what can you do", "how do I", "assist"
        ]
    }

    def recognize(self, query: str) -> Intent:
        """
        Recognize intent from user query
        Returns intent with extracted entities
        """
        query_lower = query.lower()

        # Match against patterns
        matched_intent = IntentType.UNKNOWN
        max_confidence = 0.0

        for intent_type, keywords in self.PATTERNS.items():
            matches = sum(1 for keyword in keywords if keyword in query_lower)
            if matches > 0:
                confidence = min(matches / len(keywords) + 0.5, 1.0)
                if confidence > max_confidence:
                    max_confidence = confidence
                    matched_intent = intent_type

        # Extract entities based on intent
        entities = self._extract_entities(query, matched_intent)

        return Intent(
            type=matched_intent,
            confidence=max_confidence if max_confidence > 0 else 0.3,
            entities=entities,
            raw_query=query
        )

    def _extract_entities(self, query: str, intent: IntentType) -> Dict[str, Any]:
        """
        Extract entities from query based on intent type
        Uses pattern matching and keyword extraction
        """
        entities = {}
        query_lower = query.lower()

        # Include raw query for automations that need it
        entities["raw_query"] = query

        # Extract common entities
        entities.update(self._extract_dates(query_lower))
        entities.update(self._extract_locations(query_lower))
        entities.update(self._extract_numbers(query_lower))

        # Intent-specific entity extraction
        if intent == IntentType.SEARCH_FLIGHT:
            entities.update(self._extract_flight_entities(query_lower))
        elif intent == IntentType.SEARCH_HOTEL:
            entities.update(self._extract_hotel_entities(query_lower))
        elif intent == IntentType.BUILD_ITINERARY:
            entities.update(self._extract_itinerary_entities(query_lower))

        return entities

    def _extract_dates(self, query: str) -> Dict[str, Any]:
        """Extract date-related entities"""
        entities = {}

        # Simple date keywords
        if "tomorrow" in query:
            entities["relative_date"] = "tomorrow"
        elif "today" in query:
            entities["relative_date"] = "today"
        elif "next week" in query:
            entities["relative_date"] = "next_week"

        # Month extraction
        months = ["january", "february", "march", "april", "may", "june",
                 "july", "august", "september", "october", "november", "december"]
        for i, month in enumerate(months, 1):
            if month in query:
                entities["month"] = month
                entities["month_number"] = i

        return entities

    def _extract_locations(self, query: str) -> Dict[str, Any]:
        """Extract location entities including origin and destination"""
        entities = {}

        import re

        # Common locations (expand this with your database)
        locations = {
            "cape town": "CPT",
            "capetown": "CPT",
            "nairobi": "NBO",
            "kampala": "EBB",
            "entebbe": "EBB",
            "mombasa": "MBA",
            "zanzibar": "ZNZ",
            "dar es salaam": "DAR",
            "serengeti": "SRG",
            "masai mara": "MRA",
            "mara": "MRA",
            "kigali": "KGL",
            "addis ababa": "ADD",
            "johannesburg": "JNB",
            "durban": "DUR",
            "kenya": "KE",
            "tanzania": "TZ",
            "south africa": "ZA",
            "uganda": "UG"
        }

        # Try to extract origin and destination from "from X to Y" pattern
        from_to_pattern = r'from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s|$|tomorrow|today|next|for|at|,|\.)'
        match = re.search(from_to_pattern, query, re.IGNORECASE)

        if match:
            origin_text = match.group(1).strip().lower()
            dest_text = match.group(2).strip().lower()

            # Find origin in locations dict
            for name, code in locations.items():
                if name in origin_text or origin_text in name:
                    entities["origin"] = code
                    entities["origin_name"] = name.title()
                    break

            # Find destination in locations dict
            for name, code in locations.items():
                if name in dest_text or dest_text in name:
                    entities["destination"] = code
                    entities["destination_name"] = name.title()
                    break
        else:
            # If no "from X to Y" pattern, just look for any destination mention
            for name, code in locations.items():
                if name in query:
                    entities["destination"] = code
                    entities["destination_name"] = name.title()
                    break

        return entities

    def _extract_numbers(self, query: str) -> Dict[str, Any]:
        """Extract number-related entities"""
        entities = {}

        # Number of people
        import re
        people_patterns = [
            r"(\d+)\s*people",
            r"(\d+)\s*persons",
            r"(\d+)\s*travelers",
            r"(\d+)\s*pax",
            r"family of (\d+)"
        ]

        for pattern in people_patterns:
            match = re.search(pattern, query)
            if match:
                entities["travelers_count"] = int(match.group(1))
                break

        # Duration in days/nights
        duration_patterns = [
            r"(\d+)\s*days?",
            r"(\d+)\s*nights?",
            r"(\d+)[-\s]day"
        ]

        for pattern in duration_patterns:
            match = re.search(pattern, query)
            if match:
                entities["duration_days"] = int(match.group(1))
                break

        return entities

    def _extract_flight_entities(self, query: str) -> Dict[str, Any]:
        """Extract flight-specific entities"""
        entities = {}

        # Time preferences
        if "morning" in query or "am" in query:
            entities["time_preference"] = "morning"
        elif "afternoon" in query or "midday" in query or "noon" in query:
            entities["time_preference"] = "afternoon"
        elif "evening" in query or "night" in query:
            entities["time_preference"] = "evening"

        # Flight class
        if "business" in query or "business class" in query:
            entities["class"] = "business"
        elif "first" in query or "first class" in query:
            entities["class"] = "first"
        else:
            entities["class"] = "economy"

        # Direct flight preference
        if "direct" in query or "non-stop" in query or "nonstop" in query:
            entities["direct_only"] = True

        return entities

    def _extract_hotel_entities(self, query: str) -> Dict[str, Any]:
        """Extract hotel-specific entities"""
        entities = {}

        # Hotel type
        if "luxury" in query or "5 star" in query or "five star" in query:
            entities["hotel_category"] = "luxury"
        elif "budget" in query or "cheap" in query or "affordable" in query:
            entities["hotel_category"] = "budget"
        elif "boutique" in query:
            entities["hotel_category"] = "boutique"

        # Amenities
        if "pool" in query or "swimming" in query:
            entities["amenities"] = entities.get("amenities", []) + ["pool"]
        if "wifi" in query or "internet" in query:
            entities["amenities"] = entities.get("amenities", []) + ["wifi"]
        if "spa" in query:
            entities["amenities"] = entities.get("amenities", []) + ["spa"]

        return entities

    def _extract_itinerary_entities(self, query: str) -> Dict[str, Any]:
        """Extract itinerary-specific entities"""
        entities = {}

        # Trip type
        if "safari" in query:
            entities["trip_type"] = "safari"
        elif "beach" in query:
            entities["trip_type"] = "beach"
        elif "city" in query:
            entities["trip_type"] = "city"
        elif "adventure" in query:
            entities["trip_type"] = "adventure"

        # Interests
        if "wildlife" in query or "animals" in query:
            entities["interests"] = entities.get("interests", []) + ["wildlife"]
        if "culture" in query or "cultural" in query:
            entities["interests"] = entities.get("interests", []) + ["culture"]
        if "photography" in query:
            entities["interests"] = entities.get("interests", []) + ["photography"]

        return entities


# Global intent recognizer instance
intent_recognizer = IntentRecognizer()
