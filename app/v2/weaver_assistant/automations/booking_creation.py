"""
Booking Creation Automation
Your algorithm for creating and managing bookings
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus
from app.v2.core.database import get_mongo_db
import uuid


class BookingCreationAutomation(BaseAutomation):
    """
    Creates bookings from chat interactions
    This is YOUR algorithm - handles booking creation workflow
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute booking creation automation
        """
        # Check if we have itinerary/flight/hotel data from conversation context
        conversation_context = context.get("conversation_context", {})

        # Try to get booking data from entities or context
        booking_data = self._extract_booking_data(entities, conversation_context)

        # Validate required booking information
        validation_error = self._validate_booking_data(booking_data)
        if validation_error:
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message=validation_error,
                template="missing_info",
                data={"missing_fields": validation_error}
            )

        # Check if we have traveler information
        if not booking_data.get("travelers"):
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message="I need traveler information to create the booking. Please provide:\n\n• Number of travelers\n• Lead traveler name and contact\n\nOr say 'use existing traveler' if you have travelers in the system.",
                template="missing_travelers",
                actions=[
                    {"type": "quick_reply", "label": "Add New Traveler", "action": "create_traveler"},
                    {"type": "quick_reply", "label": "Use Existing Traveler", "action": "select_traveler"}
                ]
            )

        # Create the booking
        try:
            booking = await self._create_booking(
                booking_data=booking_data,
                user_id=context.get("user_id"),
                organization_id=context.get("organization_id")
            )

            return AutomationResult(
                status=AutomationStatus.SUCCESS,
                data={
                    "booking": booking,
                    "next_steps": self._get_next_steps(booking)
                },
                message=f"✓ Booking created successfully!\n\n**Booking Reference:** {booking['booking_reference']}\n**Status:** {booking['status'].title()}\n**Total Amount:** ${booking['total_amount']:,.2f}\n\nWhat would you like to do next?",
                template="booking_confirmation",
                requires_confirmation=False,
                next_step="collect_payment_or_documents",
                actions=[
                    {
                        "type": "button",
                        "label": "View Booking Details",
                        "action": "view_booking",
                        "data": {"booking_id": booking["id"]}
                    },
                    {
                        "type": "button",
                        "label": "Collect Documents",
                        "action": "collect_documents"
                    },
                    {
                        "type": "button",
                        "label": "Send Payment Link",
                        "action": "send_payment_link"
                    },
                    {
                        "type": "button",
                        "label": "Create Another Booking",
                        "action": "create_booking"
                    }
                ]
            )

        except Exception as e:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"Failed to create booking: {str(e)}",
                template="error"
            )

    def _extract_booking_data(
        self,
        entities: Dict[str, Any],
        conversation_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Extract booking data from entities and conversation context
        """
        booking_data = {}

        # Check for itinerary in context (from previous itinerary builder)
        if "itinerary" in conversation_context:
            itinerary = conversation_context["itinerary"]
            booking_data["itinerary"] = itinerary
            booking_data["start_date"] = itinerary.get("start_date")
            booking_data["end_date"] = itinerary.get("end_date")
            booking_data["destination"] = itinerary.get("destination")

        # Check for flights in context
        if "selected_flight" in conversation_context:
            booking_data["flights"] = [conversation_context["selected_flight"]]

        # Check for hotels in context
        if "selected_hotel" in conversation_context:
            booking_data["hotels"] = [conversation_context["selected_hotel"]]

        # Extract from entities
        if "destination" in entities:
            booking_data["destination"] = entities["destination_name"] or entities["destination"]

        if "travelers_count" in entities:
            booking_data["travelers_count"] = entities["travelers_count"]

        # Check for traveler references
        if "traveler_id" in entities:
            booking_data["travelers"] = [{"id": entities["traveler_id"]}]

        return booking_data

    def _validate_booking_data(self, booking_data: Dict[str, Any]) -> Optional[str]:
        """
        Validate that we have minimum required booking information
        Returns error message if validation fails
        """
        # Must have at least one service (itinerary, flight, or hotel)
        has_service = any([
            booking_data.get("itinerary"),
            booking_data.get("flights"),
            booking_data.get("hotels")
        ])

        if not has_service:
            return "I need more information to create a booking. Please specify what you'd like to book:\n\n• Build an itinerary\n• Search for flights\n• Search for hotels"

        # Must have destination
        if not booking_data.get("destination"):
            return "Please specify the destination for this booking."

        return None

    async def _create_booking(
        self,
        booking_data: Dict[str, Any],
        user_id: str,
        organization_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Create booking record in database
        """
        db = get_mongo_db()
        if not db:
            raise Exception("Database not available")

        # Generate booking reference
        booking_reference = self._generate_booking_reference()

        # Calculate total amount
        total_amount = self._calculate_total_amount(booking_data)

        # Build services list
        services = []

        if booking_data.get("itinerary"):
            services.append({
                "type": "itinerary",
                "data": booking_data["itinerary"],
                "status": "confirmed"
            })

        if booking_data.get("flights"):
            for flight in booking_data["flights"]:
                services.append({
                    "type": "flight",
                    "data": flight,
                    "status": "pending"
                })

        if booking_data.get("hotels"):
            for hotel in booking_data["hotels"]:
                services.append({
                    "type": "hotel",
                    "data": hotel,
                    "status": "pending"
                })

        # Create booking document
        booking = {
            "booking_reference": booking_reference,
            "status": "pending",
            "created_by": user_id,
            "organization_id": organization_id,
            "destination": booking_data.get("destination"),
            "start_date": booking_data.get("start_date"),
            "end_date": booking_data.get("end_date"),
            "travelers": booking_data.get("travelers", []),
            "travelers_count": booking_data.get("travelers_count", len(booking_data.get("travelers", []))),
            "services": services,
            "total_amount": total_amount,
            "currency": "USD",
            "payment_status": "pending",
            "documents_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "source": "weaver_assistant"
        }

        # Insert into database
        result = db.bookings.insert_one(booking)
        booking["id"] = str(result.inserted_id)

        # Remove MongoDB _id from response
        if "_id" in booking:
            del booking["_id"]

        return booking

    def _generate_booking_reference(self) -> str:
        """
        Generate unique booking reference
        Format: WV-YYYYMMDD-XXXX
        """
        date_part = datetime.now().strftime("%Y%m%d")
        random_part = str(uuid.uuid4())[:4].upper()
        return f"WV-{date_part}-{random_part}"

    def _calculate_total_amount(self, booking_data: Dict[str, Any]) -> float:
        """
        Calculate total booking amount
        """
        total = 0.0

        # Itinerary pricing
        if booking_data.get("itinerary"):
            itinerary = booking_data["itinerary"]
            pricing = itinerary.get("pricing", {})
            total += pricing.get("total", 0)

        # Flight pricing
        if booking_data.get("flights"):
            for flight in booking_data["flights"]:
                total += flight.get("price", 0)

        # Hotel pricing
        if booking_data.get("hotels"):
            for hotel in booking_data["hotels"]:
                total += hotel.get("total_price", 0)

        return total

    def _get_next_steps(self, booking: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Determine next steps based on booking status
        """
        steps = []

        if booking["payment_status"] == "pending":
            steps.append({
                "step": "payment",
                "title": "Collect Payment",
                "description": "Send payment link to customer",
                "priority": "high"
            })

        if booking["documents_status"] == "pending":
            steps.append({
                "step": "documents",
                "title": "Collect Documents",
                "description": "Collect passport copies and required documents",
                "priority": "high"
            })

        steps.append({
            "step": "confirmation",
            "title": "Send Confirmation",
            "description": "Send booking confirmation email to customer",
            "priority": "medium"
        })

        return steps
