"""
WeaverAssistant Orchestration Service
Coordinates intent recognition → automation → response
"""

from typing import Dict, Any, Optional
from datetime import datetime

from app.v2.weaver_assistant.intent import intent_recognizer, IntentType
from app.v2.weaver_assistant.automation import automation_registry, AutomationResult, AutomationStatus
from app.v2.core.database import get_mongo_db


class WeaverAssistantService:
    """
    Main orchestration service for WeaverAssistant
    Coordinates: Intent Recognition → Automation → Response
    """

    def __init__(self):
        self.intent_recognizer = intent_recognizer
        self.automation_registry = automation_registry

        # Register automations
        self._register_automations()

    def _register_automations(self):
        """Register all available automations"""
        from app.v2.weaver_assistant.automations.greeting import GreetingAutomation
        from app.v2.weaver_assistant.automations.flight_search import FlightSearchAutomation
        from app.v2.weaver_assistant.automations.hotel_search import HotelSearchAutomation
        from app.v2.weaver_assistant.automations.itinerary_builder import ItineraryBuilderAutomation
        from app.v2.weaver_assistant.automations.booking_creation import BookingCreationAutomation
        from app.v2.weaver_assistant.automations.view_bookings import ViewBookingsAutomation

        # Register each automation with its intent type
        self.automation_registry.register(IntentType.GREETING, GreetingAutomation())
        self.automation_registry.register(IntentType.SEARCH_FLIGHT, FlightSearchAutomation())
        self.automation_registry.register(IntentType.SEARCH_HOTEL, HotelSearchAutomation())
        self.automation_registry.register(IntentType.BUILD_ITINERARY, ItineraryBuilderAutomation())
        self.automation_registry.register(IntentType.CREATE_BOOKING, BookingCreationAutomation())
        self.automation_registry.register(IntentType.VIEW_BOOKING, ViewBookingsAutomation())

        # TODO: Register more automations as you build them
        # etc.

    async def process_message(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user message through the automation pipeline

        Args:
            user_id: User sending the message
            message: User's message text
            conversation_id: Optional conversation ID for context
            organization_id: Optional organization context

        Returns:
            Response with automation result and formatted message
        """
        # 1. Load conversation context
        context = await self._load_context(user_id, conversation_id, organization_id)

        # 2. Recognize intent (1% AI / 99% patterns)
        intent = self.intent_recognizer.recognize(message)

        # 3. Get automation for intent
        automation = self.automation_registry.get(intent.type)

        if not automation:
            # Fallback for unknown intents
            return self._unknown_intent_response(intent, context)

        # 4. Execute automation (99% your algorithms)
        automation_result = await automation.execute(
            entities=intent.entities,
            context=context
        )

        # 5. Save message and response to conversation
        await self._save_to_conversation(
            conversation_id=conversation_id,
            user_id=user_id,
            user_message=message,
            intent=intent,
            automation_result=automation_result
        )

        # 6. Return formatted response
        return {
            "success": True,
            "conversation_id": conversation_id,
            "intent": {
                "type": intent.type,
                "confidence": intent.confidence,
                "entities": intent.entities
            },
            "response": {
                "message": automation_result.message,
                "template": automation_result.template,
                "data": automation_result.data,
                "actions": automation_result.actions,
                "status": automation_result.status
            },
            "requires_confirmation": automation_result.requires_confirmation,
            "next_step": automation_result.next_step
        }

    async def _load_context(
        self,
        user_id: str,
        conversation_id: Optional[str],
        organization_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Load conversation context
        Includes user info, org info, conversation history
        """
        context = {
            "user_id": user_id,
            "organization_id": organization_id,
            "conversation_id": conversation_id
        }

        try:
            db = get_mongo_db()
            if not db:
                return context

            # Load user info
            user = db.users.find_one({"_id": user_id})
            if user:
                context["user"] = {
                    "id": str(user["_id"]),
                    "email": user.get("email"),
                    "full_name": user.get("full_name"),
                    "role": user.get("role"),
                    "organization_id": user.get("organization_id")
                }

            # Load conversation history if exists
            if conversation_id:
                conversation = db.conversations.find_one({"_id": conversation_id})
                if conversation:
                    context["conversation_history"] = conversation.get("messages", [])
                    context["conversation_context"] = conversation.get("context", {})

        except Exception as e:
            print(f"Warning: Could not load context: {e}")

        return context

    async def _save_to_conversation(
        self,
        conversation_id: Optional[str],
        user_id: str,
        user_message: str,
        intent: Any,
        automation_result: AutomationResult
    ):
        """
        Save message and response to conversation history
        """
        try:
            db = get_mongo_db()
            if not db:
                return

            # Create conversation if doesn't exist
            if not conversation_id:
                conversation = {
                    "user_id": user_id,
                    "messages": [],
                    "context": {},
                    "status": "active",
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                result = db.conversations.insert_one(conversation)
                conversation_id = str(result.inserted_id)

            # Add user message
            user_msg = {
                "role": "user",
                "content": user_message,
                "timestamp": datetime.utcnow()
            }

            # Add assistant response
            assistant_msg = {
                "role": "assistant",
                "content": automation_result.message,
                "timestamp": datetime.utcnow(),
                "metadata": {
                    "intent": intent.type,
                    "template": automation_result.template,
                    "status": automation_result.status
                }
            }

            # Update conversation
            db.conversations.update_one(
                {"_id": conversation_id},
                {
                    "$push": {
                        "messages": {
                            "$each": [user_msg, assistant_msg]
                        }
                    },
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "last_activity": datetime.utcnow()
                    }
                }
            )

        except Exception as e:
            print(f"Warning: Could not save conversation: {e}")

    def _unknown_intent_response(self, intent: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback response for unknown intents
        """
        return {
            "success": True,
            "intent": {
                "type": "unknown",
                "confidence": intent.confidence,
                "entities": intent.entities
            },
            "response": {
                "message": "I'm not sure I understood that. Could you rephrase? I can help you with:\n\n• Searching flights and hotels\n• Building itineraries\n• Managing bookings and travelers\n• Getting destination information",
                "template": "help",
                "data": None,
                "actions": [
                    {"type": "quick_reply", "label": "Search Flights", "action": "search_flight"},
                    {"type": "quick_reply", "label": "View Bookings", "action": "view_bookings"},
                    {"type": "quick_reply", "label": "Build Itinerary", "action": "build_itinerary"}
                ],
                "status": "success"
            }
        }


# Global service instance
weaver_assistant_service = WeaverAssistantService()
