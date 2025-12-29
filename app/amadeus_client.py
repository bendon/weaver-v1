"""
Amadeus API Client for ItineraryWeaver PoC
"""

import os
import requests
import time
from typing import Dict, List, Optional, Any
from datetime import date, datetime, timedelta
import hashlib


class AmadeusClient:
    """
    Client for interacting with Amadeus API (test environment)
    
    Documentation: https://developers.amadeus.com/
    """
    
    TEST_BASE_URL = "https://test.api.amadeus.com"
    PROD_BASE_URL = "https://api.amadeus.com"
    
    def __init__(
        self,
        api_key: str,
        api_secret: str,
        environment: str = "test"
    ):
        """
        Initialize Amadeus client
        
        Args:
            api_key: Amadeus API key
            api_secret: Amadeus API secret
            environment: "test" or "production"
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.environment = environment
        self.base_url = self.TEST_BASE_URL if environment == "test" else self.PROD_BASE_URL
        self._token = None
        self._token_expires_at = None
    
    def _get_token_sync(self) -> str:
        """
        Get or refresh access token (synchronous)
        
        Returns:
            Access token string
        """
        # Check if we have a valid token
        if self._token and self._token_expires_at:
            if datetime.now() < self._token_expires_at:
                return self._token
        
        # Request new token
        url = f"{self.base_url}/v1/security/oauth2/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.api_key,
            "client_secret": self.api_secret
        }
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        response = requests.post(url, data=data, headers=headers)
        
        # Better error handling
        if not response.ok:
            error_msg = f"Authentication failed (HTTP {response.status_code})"
            try:
                error_data = response.json()
                if "error_description" in error_data:
                    error_msg += f": {error_data['error_description']}"
                elif "error" in error_data:
                    error_msg += f": {error_data['error']}"
            except:
                error_msg += f": {response.text[:200]}"
            raise Exception(error_msg)
        
        token_data = response.json()
        self._token = token_data["access_token"]
        expires_in = token_data.get("expires_in", 1800)  # Default 30 minutes
        
        # Set expiration time (subtract 60 seconds for safety)
        self._token_expires_at = datetime.now() + timedelta(seconds=expires_in - 60)
        
        return self._token
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict:
        """
        Make authenticated request to Amadeus API
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., "/v2/shopping/flight-offers")
            params: Query parameters
            data: Request body data
            headers: Additional headers
        
        Returns:
            JSON response as dictionary
        """
        token = self._get_token_sync()
        
        url = f"{self.base_url}{endpoint}"
        request_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        if headers:
            request_headers.update(headers)
        
        response = requests.request(
            method=method,
            url=url,
            params=params,
            json=data,
            headers=request_headers
        )
        
        response.raise_for_status()
        return response.json()
    
    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        travel_class: str = "ECONOMY",
        max_results: int = 10,
        non_stop: bool = False
    ) -> Dict:
        """
        Search for flight offers
        
        Args:
            origin: Origin airport IATA code (e.g., "LHR")
            destination: Destination airport IATA code (e.g., "NBO")
            departure_date: Departure date in YYYY-MM-DD format
            return_date: Return date for round trip (optional)
            adults: Number of adult passengers
            children: Number of child passengers
            infants: Number of infant passengers
            travel_class: Cabin class (ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST)
            max_results: Maximum number of results to return
            non_stop: Only return non-stop flights
        
        Returns:
            Dictionary containing flight offers
        """
        endpoint = "/v2/shopping/flight-offers"
        
        params = {
            "originLocationCode": origin,
            "destinationLocationCode": destination,
            "departureDate": departure_date,
            "adults": adults,
            "max": max_results,
            "travelClass": travel_class
        }
        
        if return_date:
            params["returnDate"] = return_date
        
        if children > 0:
            params["children"] = children
        
        if infants > 0:
            params["infants"] = infants
        
        if non_stop:
            params["nonStop"] = "true"
        
        return self._make_request("GET", endpoint, params=params)
    
    def get_flight_offer_details(self, offer_id: str) -> Dict:
        """
        Get detailed information about a specific flight offer
        
        Args:
            offer_id: Flight offer ID
        
        Returns:
            Detailed flight offer information
        """
        endpoint = f"/v2/shopping/flight-offers/{offer_id}"
        return self._make_request("GET", endpoint)
    
    def search_hotels(
        self,
        city_code: str,
        check_in_date: str,
        check_out_date: str,
        adults: int = 1,
        room_quantity: int = 1
    ) -> Dict:
        """
        Search for hotel offers
        
        Args:
            city_code: IATA city code (e.g., "NBO")
            check_in_date: Check-in date in YYYY-MM-DD format
            check_out_date: Check-out date in YYYY-MM-DD format
            adults: Number of adults
            room_quantity: Number of rooms
        
        Returns:
            Dictionary containing hotel offers
        """
        endpoint = "/v3/shopping/hotel-offers"
        
        params = {
            "cityCode": city_code,
            "checkInDate": check_in_date,
            "checkOutDate": check_out_date,
            "adults": adults,
            "roomQuantity": room_quantity
        }
        
        return self._make_request("GET", endpoint, params=params)
    
    def get_airport_info(self, airport_code: str) -> Dict:
        """
        Get airport information
        
        Args:
            airport_code: IATA airport code
        
        Returns:
            Airport information
        """
        endpoint = "/v1/reference-data/locations"
        params = {
            "subType": "AIRPORT",
            "keyword": airport_code
        }
        
        return self._make_request("GET", endpoint, params=params)
    
    def create_booking(
        self,
        flight_offer: Dict[str, Any],
        travelers: List[Dict[str, Any]],
        contacts: Optional[List[Dict[str, Any]]] = None,
        remarks: Optional[Dict[str, Any]] = None,
        ticketing_agreement: Optional[Dict[str, Any]] = None
    ) -> Dict:
        """
        Create a flight booking (Order Management API)
        
        Args:
            flight_offer: Flight offer from search results (must be priced first)
            travelers: List of traveler details with documents
            contacts: Optional contact information
            remarks: Optional remarks
            ticketing_agreement: Optional ticketing agreement
        
        Returns:
            Booking confirmation with order ID and PNR
        """
        endpoint = "/v1/booking/flight-orders"
        
        booking_data = {
            "data": {
                "type": "flight-order",
                "flightOffers": [flight_offer],
                "travelers": travelers
            }
        }
        
        if contacts:
            booking_data["data"]["contacts"] = contacts
        
        if remarks:
            booking_data["data"]["remarks"] = remarks
        
        if ticketing_agreement:
            booking_data["data"]["ticketingAgreement"] = ticketing_agreement
        
        return self._make_request("POST", endpoint, data=booking_data)
    
    def get_booking(self, order_id: str) -> Dict:
        """
        Get flight booking details by order ID
        
        Args:
            order_id: Amadeus order ID
        
        Returns:
            Booking details
        """
        endpoint = f"/v1/booking/flight-orders/{order_id}"
        return self._make_request("GET", endpoint)
    
    def delete_booking(self, order_id: str) -> Dict:
        """
        Cancel/delete a flight booking
        
        Args:
            order_id: Amadeus order ID
        
        Returns:
            Cancellation confirmation
        """
        endpoint = f"/v1/booking/flight-orders/{order_id}"
        return self._make_request("DELETE", endpoint)
    
    def price_flight_offer(self, flight_offer: Dict[str, Any]) -> Dict:
        """
        Get confirmed price for a flight offer before booking
        
        Args:
            flight_offer: Flight offer from search results
        
        Returns:
            Priced flight offer ready for booking
        """
        endpoint = "/v1/shopping/flight-offers/pricing"
        
        pricing_data = {
            "data": {
                "type": "flight-offers-pricing",
                "flightOffers": [flight_offer]
            }
        }
        
        return self._make_request("POST", endpoint, data=pricing_data)
    
    def get_flight_status(
        self,
        carrier_code: str,
        flight_number: str,
        scheduled_departure_date: str
    ) -> Dict:
        """
        Get real-time flight status using On-Demand Flight Status API
        
        Args:
            carrier_code: Airline IATA code (2 letters, e.g., "KQ")
            flight_number: Flight number (1-4 digits, e.g., "100")
            scheduled_departure_date: Departure date in YYYY-MM-DD format
        
        Returns:
            Dictionary containing flight status information
        """
        endpoint = "/v2/schedule/flights"
        
        params = {
            "carrierCode": carrier_code,
            "flightNumber": flight_number,
            "scheduledDepartureDate": scheduled_departure_date
        }
        
        return self._make_request("GET", endpoint, params=params)
    
    def get_airline_info(self, airline_code: str) -> Dict:
        """
        Get airline information
        
        Args:
            airline_code: IATA airline code (2 letters)
        
        Returns:
            Dictionary containing airline information
        """
        endpoint = "/v1/reference-data/airlines"
        
        params = {
            "airlineCodes": airline_code
        }
        
        return self._make_request("GET", endpoint, params=params)
    
    def get_checkin_links(self, airline_code: str) -> Dict:
        """
        Get airline check-in links
        
        Args:
            airline_code: IATA airline code (2 letters)
        
        Returns:
            Dictionary containing check-in link information
        """
        endpoint = "/v2/reference-data/urls/checkin-links"
        
        params = {
            "airlineCode": airline_code
        }
        
        return self._make_request("GET", endpoint, params=params)

