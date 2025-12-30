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
    get_travelers_by_organization, create_hotel, create_transfer,
    create_activity, update_booking, delete_flight, delete_hotel,
    delete_transfer, delete_activity, update_traveler
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
                            "description": "Departure city name (e.g., 'Kampala', 'Nairobi') or IATA airport code (e.g., 'EBB', 'NBO'). City names will be automatically converted to airport codes."
                        },
                        "destination": {
                            "type": "string",
                            "description": "Arrival city name (e.g., 'Kampala', 'Nairobi') or IATA airport code (e.g., 'EBB', 'NBO'). City names will be automatically converted to airport codes."
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
            },
            {
                "name": "search_hotels",
                "description": "Search for hotels using the Amadeus Hotels API. Returns hotel offers with pricing and amenities.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "city_code": {
                            "type": "string",
                            "description": "IATA city code (e.g., 'NYC', 'LON', 'TYO') or hotel chain code"
                        },
                        "check_in_date": {
                            "type": "string",
                            "description": "Check-in date in YYYY-MM-DD format"
                        },
                        "check_out_date": {
                            "type": "string",
                            "description": "Check-out date in YYYY-MM-DD format"
                        },
                        "adults": {
                            "type": "integer",
                            "description": "Number of adult guests (default: 1)"
                        },
                        "rooms": {
                            "type": "integer",
                            "description": "Number of rooms (default: 1)"
                        },
                        "radius": {
                            "type": "integer",
                            "description": "Search radius in kilometers (default: 5)"
                        }
                    },
                    "required": ["city_code", "check_in_date", "check_out_date"]
                }
            },
            {
                "name": "add_hotel_to_booking",
                "description": "Add a hotel to an existing booking. Can use Amadeus hotel offer data or manual entry.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to add the hotel to"
                        },
                        "hotel_name": {
                            "type": "string",
                            "description": "Hotel name"
                        },
                        "check_in_date": {
                            "type": "string",
                            "description": "Check-in date in YYYY-MM-DD format"
                        },
                        "check_out_date": {
                            "type": "string",
                            "description": "Check-out date in YYYY-MM-DD format"
                        },
                        "city": {
                            "type": "string",
                            "description": "City name"
                        },
                        "country": {
                            "type": "string",
                            "description": "Country name"
                        },
                        "address": {
                            "type": "string",
                            "description": "Hotel address"
                        },
                        "price": {
                            "type": "number",
                            "description": "Total price"
                        },
                        "currency": {
                            "type": "string",
                            "description": "Currency code (e.g., 'USD', 'EUR')"
                        }
                    },
                    "required": ["booking_id", "hotel_name", "check_in_date", "check_out_date"]
                }
            },
            {
                "name": "add_transfer",
                "description": "Add a transfer (ground transportation) to a booking. Use for airport transfers, hotel transfers, etc.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to add the transfer to"
                        },
                        "scheduled_datetime": {
                            "type": "string",
                            "description": "Scheduled transfer datetime in ISO format"
                        },
                        "from_location": {
                            "type": "string",
                            "description": "Pickup location (e.g., 'JFK Airport', 'Hilton Tokyo')"
                        },
                        "to_location": {
                            "type": "string",
                            "description": "Drop-off location"
                        },
                        "transfer_type": {
                            "type": "string",
                            "description": "Type of transfer (e.g., 'airport', 'hotel', 'station')"
                        },
                        "vehicle_type": {
                            "type": "string",
                            "description": "Vehicle type (e.g., 'sedan', 'suv', 'van', 'bus')"
                        },
                        "supplier_name": {
                            "type": "string",
                            "description": "Transfer supplier/vendor name"
                        },
                        "price": {
                            "type": "number",
                            "description": "Transfer price"
                        }
                    },
                    "required": ["booking_id", "scheduled_datetime", "from_location", "to_location"]
                }
            },
            {
                "name": "add_activity",
                "description": "Add an activity, tour, or excursion to a booking.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to add the activity to"
                        },
                        "activity_name": {
                            "type": "string",
                            "description": "Activity name/title"
                        },
                        "scheduled_datetime": {
                            "type": "string",
                            "description": "Scheduled activity datetime in ISO format"
                        },
                        "activity_type": {
                            "type": "string",
                            "description": "Type of activity (e.g., 'tour', 'excursion', 'dining', 'event')"
                        },
                        "location": {
                            "type": "string",
                            "description": "Activity location/venue"
                        },
                        "duration_minutes": {
                            "type": "integer",
                            "description": "Duration in minutes"
                        },
                        "supplier_name": {
                            "type": "string",
                            "description": "Activity provider/supplier"
                        },
                        "price": {
                            "type": "number",
                            "description": "Activity price"
                        },
                        "description": {
                            "type": "string",
                            "description": "Activity description"
                        }
                    },
                    "required": ["booking_id", "activity_name", "scheduled_datetime"]
                }
            },
            {
                "name": "update_booking_status",
                "description": "Update the status of a booking (e.g., draft, confirmed, in_progress, completed, cancelled).",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to update"
                        },
                        "status": {
                            "type": "string",
                            "description": "New status (draft, confirmed, in_progress, completed, cancelled)"
                        }
                    },
                    "required": ["booking_id", "status"]
                }
            },
            {
                "name": "edit_booking_details",
                "description": "Edit booking details like title, dates, notes, etc.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "booking_id": {
                            "type": "string",
                            "description": "The booking ID to edit"
                        },
                        "title": {
                            "type": "string",
                            "description": "New booking title"
                        },
                        "start_date": {
                            "type": "string",
                            "description": "New start date in YYYY-MM-DD format"
                        },
                        "end_date": {
                            "type": "string",
                            "description": "New end date in YYYY-MM-DD format"
                        },
                        "notes": {
                            "type": "string",
                            "description": "Updated notes"
                        }
                    },
                    "required": ["booking_id"]
                }
            },
            {
                "name": "remove_item_from_booking",
                "description": "Remove a flight, hotel, transfer, or activity from a booking.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "item_type": {
                            "type": "string",
                            "description": "Type of item to remove (flight, hotel, transfer, activity)"
                        },
                        "item_id": {
                            "type": "string",
                            "description": "The ID of the item to remove"
                        }
                    },
                    "required": ["item_type", "item_id"]
                }
            },
            {
                "name": "update_traveler",
                "description": "Update traveler information (name, email, phone, etc.).",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "traveler_id": {
                            "type": "string",
                            "description": "The traveler ID to update"
                        },
                        "first_name": {
                            "type": "string",
                            "description": "New first name"
                        },
                        "last_name": {
                            "type": "string",
                            "description": "New last name"
                        },
                        "email": {
                            "type": "string",
                            "description": "New email"
                        },
                        "phone": {
                            "type": "string",
                            "description": "New phone number"
                        }
                    },
                    "required": ["traveler_id"]
                }
            }
        ]

    def _get_iata_code(self, location: str) -> Optional[str]:
        """Convert city name or IATA code to IATA code"""
        location = location.strip()
        
        # Check if it's already a valid IATA code (3 uppercase letters)
        if len(location) == 3 and location.isupper() and location.isalpha():
            return location
        
        # Try to find IATA code from local database
        try:
            from app.core.database import get_connection
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
                name_lower,  # Exact city match
                f"{name_lower}%",  # City starts with
                f"%{name_lower}%",  # Name contains
                name_upper,  # Exact IATA code
                name_lower,  # For ordering
                f"{name_lower}%",  # For ordering
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
                # Try searching as airport
                result = self.amadeus_client.search_airports(location, sub_type="AIRPORT")
                locations = result.get("data", [])
                if locations:
                    iata_code = locations[0].get("iataCode")
                    if iata_code:
                        return iata_code
                
                # Try searching as city
                result = self.amadeus_client.search_airports(location, sub_type="CITY")
                locations = result.get("data", [])
                if locations:
                    iata_code = locations[0].get("iataCode")
                    if iata_code:
                        return iata_code
            except Exception:
                pass
        
        return None

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

            elif tool_name == "search_hotels":
                return self._search_hotels(tool_input)

            elif tool_name == "add_hotel_to_booking":
                return self._add_hotel_to_booking(tool_input)

            elif tool_name == "add_transfer":
                return self._add_transfer(tool_input)

            elif tool_name == "add_activity":
                return self._add_activity(tool_input)

            elif tool_name == "update_booking_status":
                return self._update_booking_status(tool_input)

            elif tool_name == "edit_booking_details":
                return self._edit_booking_details(tool_input)

            elif tool_name == "remove_item_from_booking":
                return self._remove_item_from_booking(tool_input)

            elif tool_name == "update_traveler":
                return self._update_traveler(tool_input)

            else:
                return {"error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            return {"error": str(e)}

    def _search_flights(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search for flights using Amadeus - automatically converts city names to IATA codes"""
        if not self.amadeus_client:
            return {"error": "Flight search is not configured. Please set Amadeus API credentials."}

        try:
            # Convert city names to IATA codes if needed
            origin = self._get_iata_code(params["origin"])
            destination = self._get_iata_code(params["destination"])
            
            if not origin:
                return {"error": f"Could not find airport code for origin: {params['origin']}. Please provide a city name or IATA code."}
            if not destination:
                return {"error": f"Could not find airport code for destination: {params['destination']}. Please provide a city name or IATA code."}
            
            results = self.amadeus_client.search_flights(
                origin=origin,
                destination=destination,
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

    def _search_hotels(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Search for hotels using Amadeus"""
        if not self.amadeus_client:
            return {"error": "Hotel search is not configured. Please set Amadeus API credentials."}

        try:
            # Use Amadeus Hotel Search API
            results = self.amadeus_client.search_hotels(
                city_code=params["city_code"],
                check_in_date=params["check_in_date"],
                check_out_date=params["check_out_date"],
                adults=params.get("adults", 1),
                rooms=params.get("rooms", 1),
                radius=params.get("radius", 5)
            )

            # Format results
            hotels = results.get("data", [])
            formatted_hotels = []

            for i, hotel in enumerate(hotels[:10]):  # Limit to top 10
                formatted_hotels.append({
                    "hotel_id": hotel.get("hotel", {}).get("hotelId"),
                    "name": hotel.get("hotel", {}).get("name", "Unknown Hotel"),
                    "chain_code": hotel.get("hotel", {}).get("chainCode"),
                    "rating": hotel.get("hotel", {}).get("rating"),
                    "city_code": hotel.get("hotel", {}).get("cityCode"),
                    "latitude": hotel.get("hotel", {}).get("latitude"),
                    "longitude": hotel.get("hotel", {}).get("longitude"),
                    "distance": hotel.get("hotel", {}).get("distance"),
                    "full_data": hotel  # Include for booking
                })

            return {
                "success": True,
                "count": len(formatted_hotels),
                "hotels": formatted_hotels
            }

        except Exception as e:
            return {"error": f"Hotel search failed: {str(e)}"}

    def _add_hotel_to_booking(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add a hotel to a booking"""
        try:
            hotel_id = create_hotel(
                booking_id=params["booking_id"],
                hotel_name=params["hotel_name"],
                check_in_date=params["check_in_date"],
                check_out_date=params["check_out_date"],
                city=params.get("city"),
                country=params.get("country"),
                address=params.get("address"),
                price=params.get("price"),
                currency=params.get("currency", "USD")
            )

            if hotel_id:
                return {
                    "success": True,
                    "hotel_id": hotel_id,
                    "message": f"Hotel '{params['hotel_name']}' added to booking successfully!"
                }
            else:
                return {"error": "Failed to add hotel to booking"}

        except Exception as e:
            return {"error": f"Failed to add hotel: {str(e)}"}

    def _add_transfer(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add a transfer to a booking"""
        try:
            transfer_id = create_transfer(
                booking_id=params["booking_id"],
                scheduled_datetime=params["scheduled_datetime"],
                from_location=params["from_location"],
                to_location=params["to_location"],
                transfer_type=params.get("transfer_type"),
                vehicle_type=params.get("vehicle_type"),
                supplier_name=params.get("supplier_name"),
                price=params.get("price"),
                currency=params.get("currency", "USD")
            )

            if transfer_id:
                return {
                    "success": True,
                    "transfer_id": transfer_id,
                    "message": f"Transfer from '{params['from_location']}' to '{params['to_location']}' added successfully!"
                }
            else:
                return {"error": "Failed to add transfer to booking"}

        except Exception as e:
            return {"error": f"Failed to add transfer: {str(e)}"}

    def _add_activity(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add an activity to a booking"""
        try:
            activity_id = create_activity(
                booking_id=params["booking_id"],
                activity_name=params["activity_name"],
                scheduled_datetime=params["scheduled_datetime"],
                activity_type=params.get("activity_type"),
                location=params.get("location"),
                duration_minutes=params.get("duration_minutes"),
                supplier_name=params.get("supplier_name"),
                price=params.get("price"),
                currency=params.get("currency", "USD"),
                description=params.get("description")
            )

            if activity_id:
                return {
                    "success": True,
                    "activity_id": activity_id,
                    "message": f"Activity '{params['activity_name']}' added to booking successfully!"
                }
            else:
                return {"error": "Failed to add activity to booking"}

        except Exception as e:
            return {"error": f"Failed to add activity: {str(e)}"}

    def _update_booking_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Update booking status"""
        try:
            success = update_booking(
                booking_id=params["booking_id"],
                status=params["status"]
            )

            if success:
                return {
                    "success": True,
                    "message": f"Booking status updated to '{params['status']}'"
                }
            else:
                return {"error": "Failed to update booking status"}

        except Exception as e:
            return {"error": f"Failed to update status: {str(e)}"}

    def _edit_booking_details(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Edit booking details"""
        try:
            # Build update dict from provided params
            updates = {}
            if "title" in params:
                updates["title"] = params["title"]
            if "start_date" in params:
                updates["start_date"] = params["start_date"]
            if "end_date" in params:
                updates["end_date"] = params["end_date"]
            if "notes" in params:
                updates["notes"] = params["notes"]

            if not updates:
                return {"error": "No fields to update"}

            success = update_booking(
                booking_id=params["booking_id"],
                **updates
            )

            if success:
                return {
                    "success": True,
                    "message": "Booking updated successfully",
                    "updated_fields": list(updates.keys())
                }
            else:
                return {"error": "Failed to update booking"}

        except Exception as e:
            return {"error": f"Failed to edit booking: {str(e)}"}

    def _remove_item_from_booking(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Remove a flight, hotel, transfer, or activity from booking"""
        try:
            item_type = params["item_type"].lower()
            item_id = params["item_id"]

            if item_type == "flight":
                success = delete_flight(item_id)
            elif item_type == "hotel":
                success = delete_hotel(item_id)
            elif item_type == "transfer":
                success = delete_transfer(item_id)
            elif item_type == "activity":
                success = delete_activity(item_id)
            else:
                return {"error": f"Unknown item type: {item_type}"}

            if success:
                return {
                    "success": True,
                    "message": f"{item_type.capitalize()} removed from booking successfully!"
                }
            else:
                return {"error": f"Failed to remove {item_type}"}

        except Exception as e:
            return {"error": f"Failed to remove item: {str(e)}"}

    def _update_traveler(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Update traveler information"""
        try:
            # Build update dict
            updates = {}
            if "first_name" in params:
                updates["first_name"] = params["first_name"]
            if "last_name" in params:
                updates["last_name"] = params["last_name"]
            if "email" in params:
                updates["email"] = params["email"]
            if "phone" in params:
                updates["phone"] = params["phone"]

            if not updates:
                return {"error": "No fields to update"}

            success = update_traveler(
                traveler_id=params["traveler_id"],
                **updates
            )

            if success:
                return {
                    "success": True,
                    "message": "Traveler updated successfully",
                    "updated_fields": list(updates.keys())
                }
            else:
                return {"error": "Failed to update traveler"}

        except Exception as e:
            return {"error": f"Failed to update traveler: {str(e)}"}

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
        system_prompt = """You are a friendly, expert travel booking assistant - like a personal travel agent who helps create amazing trips through natural conversation.

🎯 Your personality:
- Warm, conversational, and enthusiastic about travel
- Proactive: suggest next steps and improvements
- Clear: explain options simply, highlight key details
- Efficient: gather info smoothly, confirm before booking
- Professional: accurate with dates, prices, and details

✈️ How you help travelers:
1. **Understand their needs**: Ask conversational questions about destination, dates, travelers, preferences. You can accept city names (like "Kampala" or "Nairobi") - they'll be automatically converted to airport codes.
2. **Search & present options**: Use your tools to find flights, hotels, transfers, activities. Always show top options with clear pricing and details.
3. **Guide decisions**: Present options clearly, help compare, recommend based on preferences. Be proactive in suggesting next steps.
4. **Book everything**: Create the complete itinerary through natural conversation. Ask follow-up questions to gather all needed information.
5. **Confirm & summarize**: Always confirm before booking, summarize what's been created, celebrate completed bookings!

🛠 Your available tools:
- **search_flights**: Find real flights with Amadeus. Accepts city names (e.g., "Kampala", "Nairobi") or IATA codes (e.g., "EBB", "NBO") - automatically converts city names. Always show top options with prices.
- **search_hotels**: Find real hotels with Amadeus (show with ratings and amenities)
- **create_booking**: Start a new trip (do this first!)
- **add_traveler**: Add travelers to booking (get their details)
- **add_flight_to_booking**: Book a specific flight
- **add_hotel_to_booking**: Book a specific hotel
- **add_transfer**: Add ground transportation (airport pickups, etc.)
- **add_activity**: Add tours, excursions, dining, events
- **update_booking_status**: Change status (draft → confirmed)
- **edit_booking_details**: Update trip title, dates, notes
- **remove_item_from_booking**: Remove flight/hotel/transfer/activity
- **update_traveler**: Edit traveler info
- **get_booking_details**: Get current booking info
- **list_travelers**: See existing travelers in the system

📝 Booking workflow:
1. Create booking first (with title, dates)
2. Add travelers (get names, emails, phones)
3. Search and add flights (show options, let them choose)
4. Search and add hotels (show options with ratings/prices)
5. Ask about transfers (airport pickups?)
6. Ask about activities (tours, excursions?)
7. Confirm and mark booking as "confirmed"
8. Offer to send itinerary or make changes

💡 Tips for great conversations:
- Use emojis appropriately (✈️ 🏨 🚗 🎯 ✅ etc.)
- Format info clearly (use bullet points, tables when helpful)
- Show prices in context: "$500 per person" not just "$500"
- Confirm before major actions: "Should I book this flight?"
- Celebrate completed bookings: "All set! Your Tokyo adventure is ready! 🎉"
- Ask follow-ups: "Would you like me to add airport transfers?"
- Reference previous context: "For your Tokyo trip on March 15..."
- **Automatically convert city names**: When users say "Kampala" or "Nairobi", automatically convert to airport codes (EBB, NBO) - don't ask for IATA codes!
- **Be proactive**: If user says "I need a flight from Kampala to Nairobi", immediately search flights - don't ask for airport codes first!
- **Ask clarifying questions naturally**: "Is this a round trip or one-way?" "Any preferred departure times?" "Any airline preferences?"
- **Gather all info conversationally**: Ask about travelers, dates, preferences through natural conversation, not a form

Remember: You're not just a search engine - you're a travel planning partner who creates complete, amazing trips through conversation! 🌍✨"""

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
