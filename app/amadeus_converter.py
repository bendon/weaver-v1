"""
Converter utilities to transform Amadeus API responses into ItineraryWeaver models
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models import (
    FlightBooking, FlightSegment, Airport, BookingStatus
)


def convert_amadeus_flight_offer(
    offer: Dict[str, Any],
    booking_id: str,
    pnr: str,
    traveler_ids: List[str],
    source_gds: str = "AMADEUS"
) -> FlightBooking:
    """
    Convert an Amadeus flight offer to a FlightBooking model
    
    Args:
        offer: Amadeus flight offer dictionary
        booking_id: Unique booking ID
        pnr: PNR/confirmation number
        traveler_ids: List of traveler IDs for this booking
        source_gds: Source GDS (default: "AMADEUS")
    
    Returns:
        FlightBooking object
    """
    segments = []
    
    # Extract price information
    price_data = offer.get("price", {})
    total_price = float(price_data.get("total", "0"))
    currency = price_data.get("currency", "USD")
    
    # Process each itinerary (outbound and return)
    itineraries = offer.get("itineraries", [])
    segment_counter = 1
    
    for itinerary in itineraries:
        itinerary_segments = itinerary.get("segments", [])
        
        for seg_data in itinerary_segments:
            # Extract segment information
            departure = seg_data.get("departure", {})
            arrival = seg_data.get("arrival", {})
            carrier_code = seg_data.get("carrierCode", "")
            flight_number = seg_data.get("number", "")
            
            # Get carrier name (might need to look up)
            carrier_name = _get_carrier_name(carrier_code)
            
            # Parse datetimes
            departure_at = departure.get("at", "")
            if departure_at:
                # Handle ISO format with or without timezone
                if departure_at.endswith("Z"):
                    departure_at = departure_at.replace("Z", "+00:00")
                try:
                    departure_datetime = datetime.fromisoformat(departure_at)
                except ValueError:
                    # Fallback: try parsing without timezone
                    departure_datetime = datetime.fromisoformat(departure_at.replace("Z", ""))
            else:
                departure_datetime = None
            
            arrival_at = arrival.get("at", "")
            if arrival_at:
                # Handle ISO format with or without timezone
                if arrival_at.endswith("Z"):
                    arrival_at = arrival_at.replace("Z", "+00:00")
                try:
                    arrival_datetime = datetime.fromisoformat(arrival_at)
                except ValueError:
                    # Fallback: try parsing without timezone
                    arrival_datetime = datetime.fromisoformat(arrival_at.replace("Z", ""))
            else:
                arrival_datetime = None
            
            # Get cabin class from traveler pricing
            cabin_class = "ECONOMY"  # Default
            traveler_pricings = offer.get("travelerPricings", [])
            if traveler_pricings:
                fare_details = traveler_pricings[0].get("fareDetailsBySegment", [])
                if fare_details:
                    cabin_class = fare_details[0].get("cabin", "ECONOMY")
            
            # Create airport objects
            departure_airport = Airport(
                iata_code=departure.get("iataCode", ""),
                name=_get_airport_name(departure.get("iataCode", "")),
                city=_get_airport_city(departure.get("iataCode", "")),
                country=_get_airport_country(departure.get("iataCode", "")),
                terminal=departure.get("terminal")
            )
            
            arrival_airport = Airport(
                iata_code=arrival.get("iataCode", ""),
                name=_get_airport_name(arrival.get("iataCode", "")),
                city=_get_airport_city(arrival.get("iataCode", "")),
                country=_get_airport_country(arrival.get("iataCode", "")),
                terminal=arrival.get("terminal")
            )
            
            # Create flight segment
            segment = FlightSegment(
                segment_id=f"SEG{segment_counter}",
                carrier_code=carrier_code,
                carrier_name=carrier_name,
                flight_number=flight_number,
                aircraft_type=_get_aircraft_type(seg_data.get("aircraft", {}).get("code", "")),
                departure_airport=departure_airport,
                departure_datetime=departure_datetime,
                arrival_airport=arrival_airport,
                arrival_datetime=arrival_datetime,
                duration=seg_data.get("duration", ""),
                cabin_class=cabin_class,
                status=BookingStatus.CONFIRMED
            )
            
            segments.append(segment)
            segment_counter += 1
    
    # Create FlightBooking
    return FlightBooking(
        booking_id=booking_id,
        pnr=pnr,
        segments=segments,
        travelers=traveler_ids,
        total_price=total_price,
        currency=currency,
        booking_date=datetime.now(),
        source_gds=source_gds
    )


def _get_carrier_name(carrier_code: str) -> str:
    """Get carrier name from IATA code"""
    # Common airline codes - could be expanded or fetched from Amadeus
    carriers = {
        "KQ": "Kenya Airways",
        "BA": "British Airways",
        "AF": "Air France",
        "KL": "KLM",
        "LH": "Lufthansa",
        "EK": "Emirates",
        "QR": "Qatar Airways",
        "SQ": "Singapore Airlines",
        "5Y": "SafariLink",
    }
    return carriers.get(carrier_code, f"Airline {carrier_code}")


def _get_airport_name(iata_code: str) -> str:
    """Get airport name from IATA code"""
    # Common airports - could be expanded or fetched from Amadeus
    airports = {
        "LHR": "London Heathrow",
        "NBO": "Jomo Kenyatta International",
        "WIL": "Wilson Airport",
        "MRE": "Mara Serena Airstrip",
        "MBA": "Moi International Airport",
    }
    return airports.get(iata_code, f"Airport {iata_code}")


def _get_airport_city(iata_code: str) -> str:
    """Get airport city from IATA code"""
    cities = {
        "LHR": "London",
        "NBO": "Nairobi",
        "WIL": "Nairobi",
        "MRE": "Masai Mara",
        "MBA": "Mombasa",
    }
    return cities.get(iata_code, "Unknown")


def _get_airport_country(iata_code: str) -> str:
    """Get airport country from IATA code"""
    countries = {
        "LHR": "United Kingdom",
        "NBO": "Kenya",
        "WIL": "Kenya",
        "MRE": "Kenya",
        "MBA": "Kenya",
    }
    return countries.get(iata_code, "Unknown")


def _get_aircraft_type(aircraft_code: str) -> str:
    """Get aircraft type name from IATA code"""
    # Common aircraft types
    aircraft = {
        "333": "Airbus A330-300",
        "787": "Boeing 787",
        "320": "Airbus A320",
        "321": "Airbus A321",
        "73H": "Boeing 737-800",
    }
    return aircraft.get(aircraft_code, f"Aircraft {aircraft_code}")

