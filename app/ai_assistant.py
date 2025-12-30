"""
AI Booking Assistant using Anthropic Claude
Handles conversational booking creation with tool calling
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None  # type: ignore

# Import our API modules
from app.amadeus_client import AmadeusClient
from app.core.database import (
    create_booking, create_traveler, link_traveler_to_booking,
    create_flight, get_booking_by_id, get_traveler_by_id,
    get_travelers_by_organization
)


class BookingAssistant:
    """AI assistant for handling booking conversations"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the assistant with Anthropic API key"""
        if Anthropic is None:
            raise ImportError("anthropic package is not installed. Install it with: pip install anthropic")
        
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        self.client = Anthropic(api_key=self.api_key)
        # Use Claude 3 Opus (works with this API key)
        # Note: If you have access to Claude 3.5 Sonnet, you can change this to:
        # "claude-3-5-sonnet-20241022" or "claude-3-5-sonnet-20240620"
        self.model = "claude-3-opus-20240229"

        # Initialize Amadeus client for flight searches
        self.amadeus_client = None
        try:
            amadeus_key = os.getenv("AMADEUS_API_KEY")
            amadeus_secret = os.getenv("AMADEUS_API_SECRET")
            if amadeus_key and amadeus_secret:
                self.amadeus_client = AmadeusClient(
                    api_key=amadeus_key,
                    api_secret=amadeus_secret,
                    environment=os.getenv("AMADEUS_ENVIRONMENT", "test")
                )
        except Exception as e:
            print(f"Warning: Could not initialize Amadeus client: {e}")

    def get_tools(self) -> List[Dict[str, Any]]:
        """Define available tools for Claude"""
        return [
            {
                "name": "search_flights",
                "description": "Search for flights using the Amadeus API. Returns real flight offers with pricing.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "origin": {
                            "type": "string",
                            "description": "IATA airport code for departure (e.g., 'JFK', 'NBO')"
                        },
                        "destination": {
                            "type": "string",
                            "description": "IATA airport code for arrival (e.g., 'LAX', 'NBO')"
                        },
                        "departure_date": {
                            "type": "string",
                            "description": "Departure date in YYYY-MM-DD format"
                        },
                        "return_date": {
                            "type": "string",
                            "description": "Return date in YYYY-MM-DD format (optional for one-way)"
                        },
                        "adults": {
                            "type": "integer",
                            "description": "Number of adult travelers (default: 1)"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of flight offers to return (default: 5)"
                        }
                    },
                    "required": ["origin", "destination", "departure_date"]
                }
            },
            {
                "name": "create_booking",
                "description": "Create a new booking/itinerary in the system. This is the first step in creating a trip.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "Descriptive title for the booking (e.g., 'Kenya Safari Adventure')"
                        },
                        "start_date": {
                            "type": "string",
                            "description": "Trip start date in YYYY-MM-DD format"
                        },
                        "end_date": {
                            "type": "string",
                            "description": "Trip end date in YYYY-MM-DD format"
                        },
                        "total_travelers": {
                            "type": "integer",
                            "description": "Total number of travelers"
                        },
                        "notes": {
                            "type": "string",
                            "description": "Additional notes or special requirements"
                        }
                    },
                    "required": ["title", "start_date", "end_date"]
                }
            },
            {
                "name": "add_traveler",
                "description": "Add a new traveler to the system and optionally link to a booking.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "first_name": {
                            "type": "string",
                            "description": "Traveler's first name"
                        },
                        "last_name": {
                            "type": "string",
                            "description": "Traveler's last name"
                        },
                        "email": {
                            "type": "string",
                            "description": "Traveler's email address"
                        },
                        "phone": {
                            "type": "string",
                            "description": "Traveler's phone number"
                        },
                        "booking_id": {
                            "type": "string",
                            "description": "Booking ID to link this traveler to (optional)"
                        },
                        "is_primary": {
                            "type": "boolean",
                            "description": "Whether this is the primary traveler for the booking"
                        }
                    },
                    "required": ["first_name", "last_name", "phone"]
                }
            },
            {
                "name": "add_flight_to_booking",
                "description": "Add a flight to an existing booking. Use this after selecting a flight from search results.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to add the flight to"
                        },
                        "carrier_code": {
                            "type": "string",
                            "description": "Airline carrier code (e.g., 'BA', 'KQ')"
                        },
                        "flight_number": {
                            "type": "string",
                            "description": "Flight number"
                        },
                        "departure_airport": {
                            "type": "string",
                            "description": "Departure airport IATA code"
                        },
                        "arrival_airport": {
                            "type": "string",
                            "description": "Arrival airport IATA code"
                        },
                        "scheduled_departure": {
                            "type": "string",
                            "description": "Scheduled departure datetime in ISO format"
                        },
                        "scheduled_arrival": {
                            "type": "string",
                            "description": "Scheduled arrival datetime in ISO format"
                        },
                        "flight_type": {
                            "type": "string",
                            "description": "Flight type: 'outbound', 'return', or 'internal'"
                        },
                        "airline_name": {
                            "type": "string",
                            "description": "Full airline name"
                        }
                    },
                    "required": [
                        "booking_id", "carrier_code", "flight_number",
                        "departure_airport", "arrival_airport",
                        "scheduled_departure", "scheduled_arrival"
                    ]
                }
            },
            {
                "name": "get_booking_details",
                "description": "Retrieve details of an existing booking including travelers and items.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to retrieve"
                        }
                    },
                    "required": ["booking_id"]
                }
            },
            {
                "name": "list_travelers",
                "description": "List all existing travelers in the organization's database.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "organization_id": {
                            "type": "string",
                            "description": "Organization ID to filter travelers"
                        }
                    },
                    "required": ["organization_id"]
                }
            }
        ]

    def execute_tool(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Execute a tool and return the result"""

        try:
            if tool_name == "search_flights":
                return self._search_flights(tool_input)

            elif tool_name == "create_booking":
                return self._create_booking(tool_input, organization_id, user_id)

            elif tool_name == "add_traveler":
                return self._add_traveler(tool_input, organization_id)

            elif tool_name == "add_flight_to_booking":
                return self._add_flight_to_booking(tool_input)

            elif tool_name == "get_booking_details":
                return self._get_booking_details(tool_input["booking_id"])

            elif tool_name == "list_travelers":
                return self._list_travelers(organization_id)

            else:
                return {"error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            return {"error": str(e)}

    def _search_flights(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search for flights using Amadeus"""
        if not self.amadeus_client:
            return {"error": "Flight search is not configured. Please set Amadeus API credentials."}

        try:
            results = self.amadeus_client.search_flights(
                origin=params["origin"],
                destination=params["destination"],
                departure_date=params["departure_date"],
                return_date=params.get("return_date"),
                adults=params.get("adults", 1),
                max_results=params.get("max_results", 5)
            )

            # Format results for easier reading
            offers = results.get("data", [])
            formatted_offers = []

            for i, offer in enumerate(offers[:params.get("max_results", 5)]):
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
                    "full_offer": offer  # Include full offer for booking
                })

            return {
                "success": True,
                "count": len(formatted_offers),
                "offers": formatted_offers
            }

        except Exception as e:
            return {"error": f"Flight search failed: {str(e)}"}

    def _create_booking(
        self,
        params: Dict[str, Any],
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Create a new booking"""
        try:
            booking_id = create_booking(
                organization_id=organization_id,
                created_by=user_id,
                title=params["title"],
                start_date=params["start_date"],
                end_date=params["end_date"],
                total_travelers=params.get("total_travelers", 1),
                notes=params.get("notes")
            )

            if booking_id:
                booking = get_booking_by_id(booking_id)
                return {
                    "success": True,
                    "booking_id": booking_id,
                    "booking_code": booking.get("booking_code"),
                    "message": f"Booking '{params['title']}' created successfully!"
                }
            else:
                return {"error": "Failed to create booking"}

        except Exception as e:
            return {"error": f"Booking creation failed: {str(e)}"}

    def _add_traveler(
        self,
        params: Dict[str, Any],
        organization_id: str
    ) -> Dict[str, Any]:
        """Add a new traveler"""
        try:
            traveler_id = create_traveler(
                organization_id=organization_id,
                first_name=params["first_name"],
                last_name=params["last_name"],
                phone=params["phone"],
                email=params.get("email")
            )

            if not traveler_id:
                return {"error": "Failed to create traveler"}

            # Link to booking if provided
            if params.get("booking_id"):
                link_traveler_to_booking(
                    booking_id=params["booking_id"],
                    traveler_id=traveler_id,
                    is_primary=params.get("is_primary", False)
                )

            return {
                "success": True,
                "traveler_id": traveler_id,
                "message": f"Traveler {params['first_name']} {params['last_name']} added successfully!"
            }

        except Exception as e:
            return {"error": f"Failed to add traveler: {str(e)}"}

    def _add_flight_to_booking(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add a flight to a booking"""
        try:
            flight_id = create_flight(
                booking_id=params["booking_id"],
                carrier_code=params["carrier_code"],
                flight_number=params["flight_number"],
                departure_date=params["scheduled_departure"].split("T")[0],
                departure_airport=params["departure_airport"],
                arrival_airport=params["arrival_airport"],
                scheduled_departure=params["scheduled_departure"],
                scheduled_arrival=params["scheduled_arrival"],
                flight_type=params.get("flight_type", "outbound"),
                airline_name=params.get("airline_name"),
                status="confirmed"
            )

            if flight_id:
                return {
                    "success": True,
                    "flight_id": flight_id,
                    "message": "Flight added to booking successfully!"
                }
            else:
                return {"error": "Failed to add flight to booking"}

        except Exception as e:
            return {"error": f"Failed to add flight: {str(e)}"}

    def _get_booking_details(self, booking_id: str) -> Dict[str, Any]:
        """Get booking details"""
        try:
            booking = get_booking_by_id(booking_id)
            if booking:
                return {
                    "success": True,
                    "booking": booking
                }
            else:
                return {"error": "Booking not found"}

        except Exception as e:
            return {"error": f"Failed to get booking: {str(e)}"}

    def _list_travelers(self, organization_id: str) -> Dict[str, Any]:
        """List all travelers for organization"""
        try:
            travelers = get_travelers_by_organization(organization_id)
            return {
                "success": True,
                "count": len(travelers),
                "travelers": travelers
            }

        except Exception as e:
            return {"error": f"Failed to list travelers: {str(e)}"}

    async def chat(
        self,
        message: str,
        conversation_history: List[Dict[str, Any]],
        organization_id: str,
        user_id: str,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Send a message to Claude and handle tool calling

        Returns:
            {
                "response": str,  # Claude's text response
                "tool_calls": List[Dict],  # List of tool calls made
                "stop_reason": str  # Why Claude stopped
            }
        """

        # Add the new user message to history
        messages = conversation_history + [{
            "role": "user",
            "content": message
        }]

        # System prompt for booking assistant
        system_prompt = """You are an expert travel booking assistant helping to create detailed travel itineraries and bookings.

Your role is to:
1. Understand the traveler's requirements through natural conversation
2. Search for flights, hotels, and activities using available tools
3. Create bookings and add all necessary components
4. Provide clear, helpful information about travel options

When creating bookings:
- Always gather: destination, dates, number of travelers, and traveler details
- Use search_flights to find real flight options
- Create the booking first, then add travelers and flights
- Provide clear summaries of what you've created

Be conversational, friendly, and thorough. Ask clarifying questions when needed."""

        tool_calls_made = []
        response_text = ""

        # Initial API call
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system_prompt,
            tools=self.get_tools(),
            messages=messages
        )

        # Handle tool use loop
        while response.stop_reason == "tool_use":
            # Extract tool calls
            tool_use_blocks = [block for block in response.content if block.type == "tool_use"]

            # Execute each tool
            tool_results = []
            for tool_block in tool_use_blocks:
                tool_name = tool_block.name
                tool_input = tool_block.input

                # Execute the tool
                result = self.execute_tool(
                    tool_name=tool_name,
                    tool_input=tool_input,
                    organization_id=organization_id,
                    user_id=user_id
                )

                # Track tool call
                tool_calls_made.append({
                    "name": tool_name,
                    "input": tool_input,
                    "result": result
                })

                # Prepare tool result for Claude
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_block.id,
                    "content": json.dumps(result)
                })

            # Add assistant's response with tool uses to messages
            messages.append({
                "role": "assistant",
                "content": response.content
            })

            # Add tool results to messages
            messages.append({
                "role": "user",
                "content": tool_results
            })

            # Continue conversation with tool results
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                system=system_prompt,
                tools=self.get_tools(),
                messages=messages
            )

        # Extract text response
        text_blocks = [block for block in response.content if hasattr(block, "text")]
        response_text = "\n".join([block.text for block in text_blocks])

        return {
            "response": response_text,
            "tool_calls": tool_calls_made,
            "stop_reason": response.stop_reason
        }
