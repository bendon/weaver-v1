"""
Greeting Automation
Handles welcome messages and introduction
"""

from typing import Dict, Any
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult, AutomationStatus


class GreetingAutomation(BaseAutomation):
    """Handles greeting and welcome messages"""

    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Generate personalized greeting
        """
        user_name = context.get("user", {}).get("full_name", "there")
        first_name = user_name.split()[0] if user_name != "there" else "there"

        greeting_message = f"""Hello {first_name}! 👋

I'm **WeaverAssistant**, your AI travel planning companion. I can help you with:

🔍 **Search & Book**
- Find flights, hotels, and activities
- Create complete travel itineraries
- Book trips for your clients

📊 **Manage Operations**
- View and manage bookings
- Track traveler information
- Monitor trip status

💬 **Quick Actions**
- "Find flights to Cape Town tomorrow"
- "Show me all active bookings"
- "Create a 7-day Kenya safari itinerary"

What would you like to do today?"""

        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            data={"greeting": greeting_message},
            message=greeting_message,
            template="greeting",
            actions=[
                {
                    "type": "quick_reply",
                    "label": "Search Flights",
                    "action": "search_flight"
                },
                {
                    "type": "quick_reply",
                    "label": "View Bookings",
                    "action": "view_bookings"
                },
                {
                    "type": "quick_reply",
                    "label": "Build Itinerary",
                    "action": "build_itinerary"
                }
            ]
        )
