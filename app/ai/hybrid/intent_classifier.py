"""
Intent Classifier - Lightweight AI for Understanding User Intent
Uses Claude Haiku for fast, cost-effective intent detection
"""
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None


class Intent(Dict[str, Any]):
    """Structured intent extracted from user message"""
    intent: str  # The detected intent type
    params: Dict[str, Any]  # Extracted parameters
    confidence: float  # Confidence score (0-1)
    raw_message: str  # Original user message


class IntentClassifier:
    """
    Lightweight AI for classifying user intents
    Uses Claude Haiku for speed and cost-efficiency
    """

    # Available intents
    INTENTS = [
        "search_flights",
        "search_hotels",
        "create_booking",
        "add_traveler",
        "add_flight_to_booking",
        "add_hotel_to_booking",
        "update_booking",
        "get_booking_details",
        "list_travelers",
        "general_question",
        "greeting",
        "unclear"
    ]

    def __init__(self, api_key: Optional[str] = None):
        """Initialize with Anthropic API key"""
        if Anthropic is None:
            raise ImportError("anthropic package is not installed")

        import os
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")

        self.client = Anthropic(api_key=self.api_key)
        # Use Haiku for speed and cost
        self.model = "claude-3-5-haiku-20241022"

    def classify(self, message: str, context: Optional[Dict[str, Any]] = None) -> Intent:
        """
        Classify user intent from natural language message

        Args:
            message: User's message
            context: Optional conversation context

        Returns:
            Intent object with detected intent and parameters
        """
        try:
            # Build system prompt
            system_prompt = self._build_system_prompt()

            # Build user prompt with context
            user_prompt = self._build_user_prompt(message, context)

            # Call Claude Haiku (fast, cheap)
            response = self.client.messages.create(
                model=self.model,
                max_tokens=300,  # Keep it short for speed
                temperature=0,  # Deterministic for consistency
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            # Parse response
            result = self._parse_response(response.content[0].text, message)

            return result

        except Exception as e:
            # Fallback to unclear intent on error
            return {
                "intent": "unclear",
                "params": {},
                "confidence": 0.0,
                "raw_message": message,
                "error": str(e)
            }

    def _build_system_prompt(self) -> str:
        """Build system prompt for intent classification"""
        return f"""You are an intent classifier for a travel booking system. Your job is to understand what the user wants and extract structured parameters.

Available Intents:
- search_flights: User wants to search for flights
- search_hotels: User wants to search for hotels
- create_booking: User wants to create a new booking/trip
- add_traveler: User wants to add a traveler
- add_flight_to_booking: User wants to add a specific flight to an existing booking
- add_hotel_to_booking: User wants to add a specific hotel to an existing booking
- update_booking: User wants to update booking details (dates, title, notes)
- get_booking_details: User wants to see booking details
- list_travelers: User wants to see list of travelers
- general_question: User is asking a general question
- greeting: User is greeting (hi, hello, etc.)
- unclear: Cannot determine user intent

Extract Parameters:
- For search_flights: origin, destination, departure_date, return_date, adults
- For search_hotels: city_code, check_in_date, check_out_date, adults, rooms
- For create_booking: title, start_date, end_date, total_travelers
- For add_traveler: first_name, last_name, email, phone
- For dates: Convert relative dates to YYYY-MM-DD format (today is {datetime.now().strftime('%Y-%m-%d')})

Examples of date conversions:
- "next Friday" → calculate the actual date
- "tomorrow" → {(datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')}
- "next week" → calculate appropriate date
- "in 3 days" → calculate date

Return ONLY valid JSON in this exact format:
{{
  "intent": "<intent_name>",
  "params": {{
    "param1": "value1",
    "param2": "value2"
  }},
  "confidence": 0.95
}}

Do not include any explanations or markdown. Only the JSON object."""

    def _build_user_prompt(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Build user prompt with message and context"""
        prompt = f"User message: {message}"

        if context:
            if context.get("current_booking_id"):
                prompt += f"\n\nContext: User has an active booking (ID: {context['current_booking_id']})"
            if context.get("recent_intent"):
                prompt += f"\nPrevious intent: {context['recent_intent']}"

        prompt += "\n\nClassify this message and extract parameters as JSON:"

        return prompt

    def _parse_response(self, response_text: str, original_message: str) -> Intent:
        """Parse Claude's response into Intent object"""
        try:
            # Try to find JSON in the response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1

            if start == -1 or end == 0:
                raise ValueError("No JSON found in response")

            json_text = response_text[start:end]
            data = json.loads(json_text)

            # Validate intent
            if data.get("intent") not in self.INTENTS:
                data["intent"] = "unclear"

            # Add raw message
            data["raw_message"] = original_message

            # Ensure confidence is between 0 and 1
            data["confidence"] = max(0.0, min(1.0, data.get("confidence", 0.5)))

            return data

        except Exception as e:
            # Fallback to unclear intent
            return {
                "intent": "unclear",
                "params": {},
                "confidence": 0.0,
                "raw_message": original_message,
                "parse_error": str(e)
            }

    def get_intent_description(self, intent: str) -> str:
        """Get human-readable description of an intent"""
        descriptions = {
            "search_flights": "Searching for flights",
            "search_hotels": "Searching for hotels",
            "create_booking": "Creating a new booking",
            "add_traveler": "Adding a traveler",
            "add_flight_to_booking": "Adding flight to booking",
            "add_hotel_to_booking": "Adding hotel to booking",
            "update_booking": "Updating booking details",
            "get_booking_details": "Retrieving booking details",
            "list_travelers": "Listing travelers",
            "general_question": "Answering a question",
            "greeting": "Greeting the user",
            "unclear": "Understanding the request"
        }
        return descriptions.get(intent, "Processing request")
