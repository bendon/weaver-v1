"""
Workflow Router - Routes Intents to Services
Pure deterministic code - no AI involved
"""
from typing import Dict, Any, Optional

from app.services.flight_service import FlightService
from app.services.booking_service import BookingService
from app.services.hotel_service import HotelService
from app.services.traveler_service import TravelerService
from app.services.base import ServiceResult
from app.amadeus_client import AmadeusClient


class WorkflowResult(Dict[str, Any]):
    """Result from executing a workflow"""
    success: bool
    data: Optional[Any]
    error: Optional[str]
    message_template: str  # Template for generating response
    workflow_type: str  # Type of workflow executed


class WorkflowRouter:
    """
    Routes intents to appropriate services
    All logic is deterministic - no AI calls
    """

    def __init__(self, amadeus_client: Optional[AmadeusClient] = None):
        """Initialize with service dependencies"""
        self.flight_service = FlightService(amadeus_client)
        self.booking_service = BookingService()
        self.hotel_service = HotelService(amadeus_client)
        self.traveler_service = TravelerService()

    def route(
        self,
        intent: Dict[str, Any],
        user_id: str,
        organization_id: str
    ) -> WorkflowResult:
        """
        Route an intent to the appropriate workflow

        Args:
            intent: Intent object from IntentClassifier
            user_id: ID of the user making the request
            organization_id: ID of the user's organization

        Returns:
            WorkflowResult with execution outcome
        """
        intent_type = intent.get("intent")
        params = intent.get("params", {})

        # Route to appropriate handler
        if intent_type == "search_flights":
            return self._handle_search_flights(params)

        elif intent_type == "search_hotels":
            return self._handle_search_hotels(params)

        elif intent_type == "create_booking":
            return self._handle_create_booking(params, user_id, organization_id)

        elif intent_type == "add_traveler":
            return self._handle_add_traveler(params, organization_id)

        elif intent_type == "add_flight_to_booking":
            return self._handle_add_flight_to_booking(params)

        elif intent_type == "add_hotel_to_booking":
            return self._handle_add_hotel_to_booking(params)

        elif intent_type == "update_booking":
            return self._handle_update_booking(params)

        elif intent_type == "get_booking_details":
            return self._handle_get_booking_details(params)

        elif intent_type == "list_travelers":
            return self._handle_list_travelers(organization_id)

        elif intent_type == "greeting":
            return self._handle_greeting()

        elif intent_type == "general_question":
            return self._handle_general_question(intent.get("raw_message", ""))

        else:
            return self._handle_unclear(intent.get("raw_message", ""))

    def _handle_search_flights(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle flight search workflow"""
        result = self.flight_service.search(params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "flight_search_results" if result["success"] else "flight_search_error",
            "workflow_type": "search_flights"
        }

    def _handle_search_hotels(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle hotel search workflow"""
        result = self.hotel_service.search(params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "hotel_search_results" if result["success"] else "hotel_search_error",
            "workflow_type": "search_hotels"
        }

    def _handle_create_booking(
        self,
        params: Dict[str, Any],
        user_id: str,
        organization_id: str
    ) -> WorkflowResult:
        """Handle booking creation workflow"""
        # Add user context to params
        params["created_by"] = user_id
        params["organization_id"] = organization_id

        result = self.booking_service.create(params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "booking_created" if result["success"] else "booking_create_error",
            "workflow_type": "create_booking"
        }

    def _handle_add_traveler(
        self,
        params: Dict[str, Any],
        organization_id: str
    ) -> WorkflowResult:
        """Handle add traveler workflow"""
        # Add organization context
        params["organization_id"] = organization_id

        result = self.traveler_service.create(params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "traveler_added" if result["success"] else "traveler_add_error",
            "workflow_type": "add_traveler"
        }

    def _handle_add_flight_to_booking(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle add flight to booking workflow"""
        result = self.flight_service.add_to_booking(**params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "flight_added" if result["success"] else "flight_add_error",
            "workflow_type": "add_flight_to_booking"
        }

    def _handle_add_hotel_to_booking(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle add hotel to booking workflow"""
        result = self.hotel_service.add_to_booking(**params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "hotel_added" if result["success"] else "hotel_add_error",
            "workflow_type": "add_hotel_to_booking"
        }

    def _handle_update_booking(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle update booking workflow"""
        booking_id = params.pop("booking_id", None)
        if not booking_id:
            return {
                "success": False,
                "data": None,
                "error": "booking_id is required",
                "message_template": "booking_update_error",
                "workflow_type": "update_booking"
            }

        result = self.booking_service.update_details(booking_id, **params)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "booking_updated" if result["success"] else "booking_update_error",
            "workflow_type": "update_booking"
        }

    def _handle_get_booking_details(self, params: Dict[str, Any]) -> WorkflowResult:
        """Handle get booking details workflow"""
        booking_id = params.get("booking_id")
        if not booking_id:
            return {
                "success": False,
                "data": None,
                "error": "booking_id is required",
                "message_template": "booking_details_error",
                "workflow_type": "get_booking_details"
            }

        result = self.booking_service.get(booking_id)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "booking_details" if result["success"] else "booking_details_error",
            "workflow_type": "get_booking_details"
        }

    def _handle_list_travelers(self, organization_id: str) -> WorkflowResult:
        """Handle list travelers workflow"""
        result = self.traveler_service.list_by_organization(organization_id)

        return {
            "success": result["success"],
            "data": result.get("data"),
            "error": result.get("error"),
            "message_template": "travelers_list" if result["success"] else "travelers_list_error",
            "workflow_type": "list_travelers"
        }

    def _handle_greeting(self) -> WorkflowResult:
        """Handle greeting"""
        return {
            "success": True,
            "data": None,
            "error": None,
            "message_template": "greeting",
            "workflow_type": "greeting"
        }

    def _handle_general_question(self, message: str) -> WorkflowResult:
        """Handle general question - will use AI for response"""
        return {
            "success": True,
            "data": {"question": message},
            "error": None,
            "message_template": "general_question",
            "workflow_type": "general_question"
        }

    def _handle_unclear(self, message: str) -> WorkflowResult:
        """Handle unclear intent"""
        return {
            "success": False,
            "data": {"message": message},
            "error": "Could not understand the request",
            "message_template": "unclear",
            "workflow_type": "unclear"
        }
