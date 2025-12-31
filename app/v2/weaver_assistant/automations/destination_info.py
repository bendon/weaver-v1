"""
Destination Information Automation
Your algorithm for providing destination information and recommendations
"""

from typing import Dict, Any
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus


class DestinationInfoAutomation(BaseAutomation):
    """
    Provides destination information and travel recommendations
    This is YOUR algorithm - includes your local knowledge and curated content
    """

    # Your curated destination database
    DESTINATIONS = {
        "Kenya": {
            "name": "Kenya",
            "description": "The heart of African safari adventures",
            "best_time": "July-October (Great Migration), January-February (dry season)",
            "highlights": [
                "Masai Mara National Reserve - witness the Great Migration",
                "Amboseli National Park - elephants with Mt. Kilimanjaro backdrop",
                "Diani Beach - pristine white sand beaches",
                "Nairobi National Park - wildlife just outside the capital",
                "Lake Nakuru - flamingos and rhinos"
            ],
            "activities": ["Game drives", "Hot air balloon safaris", "Beach relaxation", "Cultural visits to Maasai villages"],
            "visa": "eVisa required for most nationalities",
            "currency": "Kenyan Shilling (KES)",
            "language": "English and Swahili",
            "safety": "Generally safe for tourists in main tourist areas",
        },
        "Tanzania": {
            "name": "Tanzania",
            "description": "Home to Serengeti and Mount Kilimanjaro",
            "best_time": "June-October (dry season), January-February (calving season)",
            "highlights": [
                "Serengeti National Park - endless plains and wildlife",
                "Ngorongoro Crater - natural wildlife amphitheater",
                "Zanzibar - exotic spice island paradise",
                "Mount Kilimanjaro - Africa's highest peak",
                "Tarangire National Park - elephants and baobabs"
            ],
            "activities": ["Safari expeditions", "Mountain climbing", "Beach holidays", "Snorkeling and diving"],
            "visa": "Visa on arrival or eVisa",
            "currency": "Tanzanian Shilling (TZS)",
            "language": "English and Swahili",
            "safety": "Safe for tourists in established tourist areas",
        },
        "South Africa": {
            "name": "South Africa",
            "description": "Diverse landscapes from Cape Town to Kruger",
            "best_time": "May-September (dry winter for safari), November-March (summer for coast)",
            "highlights": [
                "Kruger National Park - Big Five safari experiences",
                "Cape Town - Table Mountain and Cape of Good Hope",
                "Garden Route - scenic coastal drive",
                "Winelands - Stellenbosch and Franschhoek",
                "Durban - beaches and Indian Ocean warmth"
            ],
            "activities": ["Safari", "Wine tasting", "Hiking", "Surfing", "Cage diving with sharks"],
            "visa": "Visa requirements vary by nationality",
            "currency": "South African Rand (ZAR)",
            "language": "English, Afrikaans, and 9 other official languages",
            "safety": "Exercise caution in cities, safe in tourist areas",
        },
        "Uganda": {
            "name": "Uganda",
            "description": "The Pearl of Africa - gorillas and primates",
            "best_time": "June-September, December-February (dry seasons)",
            "highlights": [
                "Bwindi Impenetrable Forest - mountain gorilla trekking",
                "Mgahinga National Park - golden monkey tracking",
                "Queen Elizabeth National Park - tree-climbing lions",
                "Murchison Falls - powerful waterfall on the Nile",
                "Kibale Forest - chimpanzee trekking"
            ],
            "activities": ["Gorilla trekking", "Primate tracking", "White water rafting", "Game drives"],
            "visa": "eVisa or visa on arrival",
            "currency": "Ugandan Shilling (UGX)",
            "language": "English and Swahili",
            "safety": "Generally safe for tourists",
        },
        "Rwanda": {
            "name": "Rwanda",
            "description": "Land of a Thousand Hills - gorillas and emerging destination",
            "best_time": "June-September, December-February",
            "highlights": [
                "Volcanoes National Park - mountain gorilla trekking",
                "Akagera National Park - Big Five reintroduced",
                "Nyungwe Forest - canopy walks and chimps",
                "Kigali - clean, modern African capital",
                "Lake Kivu - beautiful lakeside relaxation"
            ],
            "activities": ["Gorilla trekking", "City tours", "Coffee tours", "Cultural experiences"],
            "visa": "Visa on arrival for most nationalities",
            "currency": "Rwandan Franc (RWF)",
            "language": "English, French, Kinyarwanda",
            "safety": "Very safe, cleanest city in Africa",
        }
    }

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute destination info automation
        """
        # Get destination from entities
        destination = entities.get("destination_name") or entities.get("destination")

        if not destination:
            # No specific destination - provide overview
            return self._destinations_overview()

        # Find matching destination
        dest_info = self._find_destination(destination)

        if not dest_info:
            return AutomationResult(
                status=AutomationStatus.PARTIAL,
                message=f"I don't have detailed information about {destination} yet, but I can help you plan a trip there. Would you like to build an itinerary or search for flights?",
                template="destination_not_found",
                actions=[
                    {"type": "button", "label": "Build Itinerary", "action": "build_itinerary"},
                    {"type": "button", "label": "Search Flights", "action": "search_flight"},
                    {"type": "button", "label": "Search Hotels", "action": "search_hotel"}
                ]
            )

        # Format destination information
        message = self._format_destination_info(dest_info)

        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            data={"destination": dest_info},
            message=message,
            template="destination_info",
            actions=[
                {
                    "type": "button",
                    "label": f"Plan Trip to {dest_info['name']}",
                    "action": "build_itinerary"
                },
                {
                    "type": "button",
                    "label": "Search Flights",
                    "action": "search_flight"
                },
                {
                    "type": "button",
                    "label": "Find Hotels",
                    "action": "search_hotel"
                }
            ]
        )

    def _find_destination(self, query: str) -> Dict[str, Any]:
        """Find destination matching the query"""
        query_lower = query.lower()

        # Direct match
        for name, info in self.DESTINATIONS.items():
            if query_lower in name.lower():
                return info

        # Check highlights for matches
        for name, info in self.DESTINATIONS.items():
            for highlight in info.get("highlights", []):
                if query_lower in highlight.lower():
                    return info

        return None

    def _format_destination_info(self, dest: Dict[str, Any]) -> str:
        """Format destination information for display"""
        message = f"# {dest['name']}\n\n"
        message += f"_{dest['description']}_\n\n"

        message += f"**📅 Best Time to Visit**\n{dest['best_time']}\n\n"

        message += "**🌟 Top Highlights**\n"
        for highlight in dest['highlights']:
            message += f"• {highlight}\n"
        message += "\n"

        message += "**🎯 Popular Activities**\n"
        for activity in dest['activities']:
            message += f"• {activity}\n"
        message += "\n"

        message += "**ℹ️ Practical Information**\n"
        message += f"• **Visa:** {dest['visa']}\n"
        message += f"• **Currency:** {dest['currency']}\n"
        message += f"• **Language:** {dest['language']}\n"
        message += f"• **Safety:** {dest['safety']}\n"

        return message

    def _destinations_overview(self) -> AutomationResult:
        """Provide overview of available destinations"""
        message = "I can provide information about these popular destinations:\n\n"

        for name, info in self.DESTINATIONS.items():
            message += f"**{name}** - {info['description']}\n"

        message += "\nWhich destination would you like to know more about?"

        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            message=message,
            template="destinations_overview",
            actions=[
                {"type": "quick_reply", "label": "Kenya", "action": "get_destination_info"},
                {"type": "quick_reply", "label": "Tanzania", "action": "get_destination_info"},
                {"type": "quick_reply", "label": "South Africa", "action": "get_destination_info"}
            ]
        )
