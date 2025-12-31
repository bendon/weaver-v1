"""
Traveler Management Automation
Your algorithm for managing traveler information
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus
from app.v2.core.database import get_mongo_db


class TravelerManagementAutomation(BaseAutomation):
    """
    Manages traveler information queries and basic operations
    This is YOUR algorithm - handles traveler data retrieval and display
    """

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute traveler management automation
        """
        # Determine the specific action from entities
        action = self._determine_action(entities)

        if action == "list":
            return await self._list_travelers(context)
        elif action == "search":
            return await self._search_travelers(entities, context)
        elif action == "get_details":
            return await self._get_traveler_details(entities, context)
        else:
            # Default: provide help on traveler management
            return self._traveler_help()

    def _determine_action(self, entities: Dict[str, Any]) -> str:
        """Determine what traveler action the user wants"""
        raw_query = entities.get("raw_query", "").lower() if "raw_query" in entities else ""

        if any(word in raw_query for word in ["list", "show all", "view all"]):
            return "list"
        elif any(word in raw_query for word in ["search", "find", "look for"]):
            return "search"
        elif any(word in raw_query for word in ["details", "information about", "show me"]):
            return "get_details"
        else:
            return "help"

    async def _list_travelers(self, context: Dict[str, Any]) -> AutomationResult:
        """List travelers in the organization"""
        try:
            db = get_mongo_db()
            if not db:
                raise Exception("Database not available")

            # Build query for organization or user
            query = {}
            if context.get("organization_id"):
                query["organization_id"] = context["organization_id"]
            else:
                query["created_by"] = context.get("user_id")

            # Fetch travelers (limit to recent 20)
            travelers = list(
                db.travelers.find(query)
                .sort("created_at", -1)
                .limit(20)
            )

            # Convert ObjectId to string
            for traveler in travelers:
                traveler["id"] = str(traveler.pop("_id"))

            if not travelers:
                return AutomationResult(
                    status=AutomationStatus.SUCCESS,
                    message="No travelers found. Would you like to add a new traveler?",
                    template="no_travelers",
                    actions=[
                        {"type": "button", "label": "Add New Traveler", "action": "create_traveler"}
                    ]
                )

            # Format traveler summary
            summary = self._format_travelers_summary(travelers)

            return AutomationResult(
                status=AutomationStatus.SUCCESS,
                data={"travelers": travelers, "count": len(travelers)},
                message=summary,
                template="travelers_list",
                actions=[
                    {"type": "button", "label": "Add New Traveler", "action": "create_traveler"},
                    {"type": "button", "label": "Search Travelers", "action": "search_traveler"}
                ]
            )

        except Exception as e:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"Failed to retrieve travelers: {str(e)}",
                template="error"
            )

    async def _search_travelers(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """Search for specific travelers"""
        # Extract search criteria
        search_term = entities.get("traveler_name", "")

        if not search_term:
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message="Please provide a name or email to search for travelers.",
                template="missing_info"
            )

        try:
            db = get_mongo_db()
            if not db:
                raise Exception("Database not available")

            # Build search query
            query = {}
            if context.get("organization_id"):
                query["organization_id"] = context["organization_id"]
            else:
                query["created_by"] = context.get("user_id")

            # Add search filter (search in name and email)
            query["$or"] = [
                {"full_name": {"$regex": search_term, "$options": "i"}},
                {"email": {"$regex": search_term, "$options": "i"}}
            ]

            # Fetch matching travelers
            travelers = list(db.travelers.find(query).limit(10))

            # Convert ObjectId to string
            for traveler in travelers:
                traveler["id"] = str(traveler.pop("_id"))

            if not travelers:
                return AutomationResult(
                    status=AutomationStatus.SUCCESS,
                    message=f"No travelers found matching '{search_term}'.",
                    template="no_results",
                    actions=[
                        {"type": "button", "label": "Add New Traveler", "action": "create_traveler"},
                        {"type": "button", "label": "View All Travelers", "action": "view_traveler"}
                    ]
                )

            summary = f"Found {len(travelers)} traveler(s) matching '{search_term}':\n\n"
            for traveler in travelers:
                summary += f"• **{traveler.get('full_name')}** ({traveler.get('email')})\n"
                if traveler.get('phone'):
                    summary += f"  Phone: {traveler.get('phone')}\n"

            return AutomationResult(
                status=AutomationStatus.SUCCESS,
                data={"travelers": travelers, "search_term": search_term},
                message=summary,
                template="travelers_search_results"
            )

        except Exception as e:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"Failed to search travelers: {str(e)}",
                template="error"
            )

    async def _get_traveler_details(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """Get detailed information about a specific traveler"""
        traveler_id = entities.get("traveler_id")

        if not traveler_id:
            return AutomationResult(
                status=AutomationStatus.REQUIRES_INPUT,
                message="Please specify which traveler you'd like to see details for.",
                template="missing_info"
            )

        try:
            db = get_mongo_db()
            if not db:
                raise Exception("Database not available")

            # Fetch traveler
            traveler = db.travelers.find_one({"_id": traveler_id})

            if not traveler:
                return AutomationResult(
                    status=AutomationStatus.FAILED,
                    message="Traveler not found.",
                    template="not_found"
                )

            traveler["id"] = str(traveler.pop("_id"))

            # Format detailed information
            details = self._format_traveler_details(traveler)

            return AutomationResult(
                status=AutomationStatus.SUCCESS,
                data={"traveler": traveler},
                message=details,
                template="traveler_details"
            )

        except Exception as e:
            return AutomationResult(
                status=AutomationStatus.FAILED,
                message=f"Failed to retrieve traveler details: {str(e)}",
                template="error"
            )

    def _traveler_help(self) -> AutomationResult:
        """Provide help on traveler management"""
        help_message = """I can help you manage travelers. Here's what you can do:

• **View All Travelers** - "Show me all travelers"
• **Search Travelers** - "Find travelers named John"
• **Get Details** - "Show me details for [traveler name]"

What would you like to do?"""

        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            message=help_message,
            template="help",
            actions=[
                {"type": "quick_reply", "label": "View All Travelers", "action": "view_traveler"},
                {"type": "quick_reply", "label": "Add New Traveler", "action": "create_traveler"}
            ]
        )

    def _format_travelers_summary(self, travelers: List[Dict[str, Any]]) -> str:
        """Format a summary of travelers"""
        count = len(travelers)
        message = f"You have **{count}** traveler(s) in your system:\n\n"

        for traveler in travelers[:10]:  # Show first 10
            name = traveler.get("full_name", "Unknown")
            email = traveler.get("email", "")
            message += f"• **{name}**"
            if email:
                message += f" ({email})"
            message += "\n"

        if count > 10:
            message += f"\n... and {count - 10} more"

        return message

    def _format_traveler_details(self, traveler: Dict[str, Any]) -> str:
        """Format detailed traveler information"""
        details = f"**{traveler.get('full_name', 'Unknown')}**\n\n"

        if traveler.get('email'):
            details += f"📧 Email: {traveler['email']}\n"
        if traveler.get('phone'):
            details += f"📞 Phone: {traveler['phone']}\n"
        if traveler.get('nationality'):
            details += f"🌍 Nationality: {traveler['nationality']}\n"
        if traveler.get('passport_number'):
            details += f"🛂 Passport: {traveler['passport_number']}\n"
        if traveler.get('date_of_birth'):
            details += f"🎂 Date of Birth: {traveler['date_of_birth']}\n"

        # Travel preferences
        if traveler.get('preferences'):
            details += "\n**Travel Preferences:**\n"
            prefs = traveler['preferences']
            if prefs.get('dietary_requirements'):
                details += f"• Dietary: {prefs['dietary_requirements']}\n"
            if prefs.get('special_assistance'):
                details += f"• Assistance: {prefs['special_assistance']}\n"

        return details
