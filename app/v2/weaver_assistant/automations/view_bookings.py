"""
View Bookings Automation
Your algorithm for querying and displaying bookings
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus
from app.v2.core.database import get_mongo_db


class ViewBookingsAutomation(BaseAutomation):
    """
    Retrieves and displays bookings based on user query
    This is YOUR algorithm - handles booking queries and filtering
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute view bookings automation
        """
        # Build query filters from entities
        filters = self._build_filters(entities, context)

        # Fetch bookings from database
        try:
            bookings = await self._fetch_bookings(
                user_id=context.get("user_id"),
                organization_id=context.get("organization_id"),
                filters=filters
            )

            if not bookings:
                return AutomationResult(
                    status=AutomationStatus.SUCCESS,
                    message="No bookings found matching your criteria.",
                    template="no_bookings",
                    data={"filters": filters},
                    actions=[
                        {"type": "button", "label": "Create New Booking", "action": "create_booking"},
                        {"type": "button", "label": "Search Flights", "action": "search_flight"},
                        {"type": "button", "label": "Build Itinerary", "action": "build_itinerary"}
                    ]
                )

            # Format bookings for display
            formatted_bookings = self._format_bookings(bookings)

            # Generate summary
            summary = self._generate_summary(bookings, filters)

            return AutomationResult(
                status=AutomationStatus.SUCCESS,
                data={
                    "bookings": formatted_bookings,
                    "summary": summary,
                    "filters": filters,
                    "count": len(bookings)
                },
                message=summary["message"],
                template="bookings_list",
                actions=[
                    {
                        "type": "button",
                        "label": "Create New Booking",
                        "action": "create_booking"
                    },
                    {
                        "type": "button",
                        "label": "Filter Bookings",
                        "action": "filter_bookings"
                    }
                ]
            )

        except Exception as e:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"Failed to retrieve bookings: {str(e)}",
                template="error"
            )

    def _build_filters(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build database query filters from entities
        """
        filters = {}

        # Filter by status
        status_keywords = {
            "active": ["pending", "confirmed", "in_progress"],
            "pending": ["pending"],
            "confirmed": ["confirmed"],
            "completed": ["completed"],
            "cancelled": ["cancelled"]
        }

        # Check for status in query
        raw_query = entities.get("raw_query", "").lower() if "raw_query" in entities else ""
        for status, values in status_keywords.items():
            if status in raw_query:
                filters["status"] = {"$in": values}
                break

        # If no specific status mentioned, default to active bookings
        if "status" not in filters and "all" not in raw_query:
            filters["status"] = {"$in": ["pending", "confirmed", "in_progress"]}

        # Filter by destination
        if "destination" in entities:
            filters["destination"] = entities["destination"]

        # Filter by date range
        if "relative_date" in entities:
            date_filter = self._parse_date_filter(entities["relative_date"])
            if date_filter:
                filters.update(date_filter)

        # Filter by booking reference
        if "booking_reference" in entities:
            filters["booking_reference"] = entities["booking_reference"]

        return filters

    def _parse_date_filter(self, relative_date: str) -> Dict[str, Any]:
        """
        Parse relative date into date range filter
        """
        now = datetime.now()
        date_filter = {}

        if relative_date == "today":
            date_filter["start_date"] = {
                "$gte": now.strftime("%Y-%m-%d"),
                "$lte": now.strftime("%Y-%m-%d")
            }
        elif relative_date == "tomorrow":
            tomorrow = now + timedelta(days=1)
            date_filter["start_date"] = {
                "$gte": tomorrow.strftime("%Y-%m-%d"),
                "$lte": tomorrow.strftime("%Y-%m-%d")
            }
        elif relative_date == "next_week":
            next_week = now + timedelta(days=7)
            date_filter["start_date"] = {
                "$gte": now.strftime("%Y-%m-%d"),
                "$lte": next_week.strftime("%Y-%m-%d")
            }

        return date_filter

    async def _fetch_bookings(
        self,
        user_id: str,
        organization_id: Optional[str],
        filters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Fetch bookings from database
        """
        db = get_mongo_db()
        if not db:
            raise Exception("Database not available")

        # Build query
        query = {}

        # Organization-level access (if user is part of organization)
        if organization_id:
            query["organization_id"] = organization_id
        else:
            # Individual user access
            query["created_by"] = user_id

        # Apply filters
        query.update(filters)

        # Fetch bookings
        bookings = list(
            db.bookings.find(query)
            .sort("created_at", -1)
            .limit(50)
        )

        # Convert ObjectId to string
        for booking in bookings:
            booking["id"] = str(booking.pop("_id"))

        return bookings

    def _format_bookings(self, bookings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Format bookings for display
        """
        formatted = []

        for booking in bookings:
            # Extract key information
            services_summary = self._summarize_services(booking.get("services", []))

            formatted.append({
                "id": booking["id"],
                "booking_reference": booking.get("booking_reference"),
                "status": booking.get("status"),
                "destination": booking.get("destination"),
                "start_date": booking.get("start_date"),
                "end_date": booking.get("end_date"),
                "travelers_count": booking.get("travelers_count", 0),
                "total_amount": booking.get("total_amount", 0),
                "currency": booking.get("currency", "USD"),
                "payment_status": booking.get("payment_status"),
                "services_summary": services_summary,
                "created_at": booking.get("created_at"),
                "updated_at": booking.get("updated_at")
            })

        return formatted

    def _summarize_services(self, services: List[Dict[str, Any]]) -> str:
        """
        Create a text summary of booking services
        """
        service_types = {}
        for service in services:
            service_type = service.get("type", "unknown")
            service_types[service_type] = service_types.get(service_type, 0) + 1

        summary_parts = []
        if service_types.get("itinerary"):
            summary_parts.append(f"{service_types['itinerary']} Itinerary")
        if service_types.get("flight"):
            summary_parts.append(f"{service_types['flight']} Flight(s)")
        if service_types.get("hotel"):
            summary_parts.append(f"{service_types['hotel']} Hotel(s)")
        if service_types.get("activity"):
            summary_parts.append(f"{service_types['activity']} Activity")

        return ", ".join(summary_parts) if summary_parts else "No services"

    def _generate_summary(
        self,
        bookings: List[Dict[str, Any]],
        filters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate summary message and statistics
        """
        count = len(bookings)

        # Calculate totals
        total_value = sum(b.get("total_amount", 0) for b in bookings)

        # Status breakdown
        status_counts = {}
        for booking in bookings:
            status = booking.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        # Build message
        filter_desc = self._describe_filters(filters)
        message_parts = [f"Found **{count}** booking(s)"]

        if filter_desc:
            message_parts.append(f"({filter_desc})")

        message = " ".join(message_parts)

        if count > 0:
            message += f"\n\n**Total Value:** ${total_value:,.2f}"

            if status_counts:
                status_str = ", ".join([f"{count} {status}" for status, count in status_counts.items()])
                message += f"\n**Status:** {status_str}"

        return {
            "message": message,
            "count": count,
            "total_value": total_value,
            "status_counts": status_counts
        }

    def _describe_filters(self, filters: Dict[str, Any]) -> str:
        """
        Create human-readable description of filters
        """
        descriptions = []

        if "status" in filters:
            if "$in" in filters["status"]:
                statuses = filters["status"]["$in"]
                descriptions.append(", ".join(statuses))
            else:
                descriptions.append(filters["status"])

        if "destination" in filters:
            descriptions.append(f"to {filters['destination']}")

        if "booking_reference" in filters:
            descriptions.append(f"ref: {filters['booking_reference']}")

        return ", ".join(descriptions)
