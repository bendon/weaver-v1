"""
Hybrid Conversation Manager
Orchestrates the hybrid AI architecture: Code for logic, AI for conversation
"""
import json
from typing import Dict, Any, Optional, List
from datetime import datetime

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None

from app.ai.hybrid.intent_classifier import IntentClassifier
from app.workflows.workflow_router import WorkflowRouter
from app.amadeus_client import AmadeusClient
from app.core.database import get_connection


class ConversationResponse(Dict[str, Any]):
    """Response from conversation manager"""
    response: str  # Natural language response
    data: Optional[Any]  # Structured data (search results, booking details, etc.)
    intent: str  # Detected intent
    success: bool  # Whether operation succeeded
    message_id: Optional[str]  # ID of saved message


class HybridConversationManager:
    """
    Hybrid conversation manager that combines:
    - AI for understanding intent (Haiku)
    - Code for business logic (Services)
    - AI for generating responses (Haiku/Sonnet)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        amadeus_client: Optional[AmadeusClient] = None
    ):
        """Initialize hybrid conversation manager"""
        if Anthropic is None:
            raise ImportError("anthropic package is not installed")

        import os
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")

        # Initialize components
        self.intent_classifier = IntentClassifier(self.api_key)
        self.workflow_router = WorkflowRouter(amadeus_client)
        self.client = Anthropic(api_key=self.api_key)

        # Models
        self.haiku = "claude-3-5-haiku-20241022"  # Fast, cheap
        self.sonnet = "claude-3-5-sonnet-20241022"  # Better quality

    async def handle_message(
        self,
        message: str,
        conversation_id: str,
        user_id: str,
        organization_id: str
    ) -> ConversationResponse:
        """
        Handle a user message using hybrid architecture

        Flow:
        1. Classify intent (AI - Haiku) - Fast, cheap
        2. Execute workflow (Code) - Deterministic, reliable
        3. Generate response (AI - Haiku/Sonnet) - Natural language
        4. Save conversation (Code) - Database operation

        Args:
            message: User's message
            conversation_id: ID of the conversation
            user_id: ID of the user
            organization_id: ID of the user's organization

        Returns:
            ConversationResponse with natural language response and data
        """
        try:
            # Step 1: Classify intent (AI - Haiku)
            # Cost: ~$0.0001 per message
            context = self._get_conversation_context(conversation_id)
            intent = self.intent_classifier.classify(message, context)

            # Step 2: Execute workflow (Deterministic Code)
            # Cost: FREE - no AI involved
            workflow_result = self.workflow_router.route(
                intent=intent,
                user_id=user_id,
                organization_id=organization_id
            )

            # Step 3: Generate response (AI - Haiku for simple, Sonnet for complex)
            # Cost: $0.0002-0.002 depending on complexity
            response_text = self._generate_response(
                intent=intent,
                workflow_result=workflow_result,
                message=message
            )

            # Step 4: Save conversation (Code)
            # Cost: FREE
            message_id = self._save_message(
                conversation_id=conversation_id,
                user_message=message,
                assistant_message=response_text,
                intent=intent,
                workflow_result=workflow_result
            )

            return {
                "response": response_text,
                "data": workflow_result.get("data"),
                "intent": intent.get("intent"),
                "success": workflow_result.get("success", False),
                "message_id": message_id
            }

        except Exception as e:
            # Fallback error response
            return {
                "response": f"I apologize, but I encountered an error processing your request. Please try again.",
                "data": None,
                "intent": "error",
                "success": False,
                "message_id": None,
                "error": str(e)
            }

    def _generate_response(
        self,
        intent: Dict[str, Any],
        workflow_result: Dict[str, Any],
        message: str
    ) -> str:
        """
        Generate natural language response
        Uses templates for simple responses, AI for complex ones
        """
        # Get message template
        template = workflow_result.get("message_template")

        # For simple templates, use quick responses
        if self._is_simple_template(template):
            return self._generate_simple_response(intent, workflow_result, template)

        # For complex cases, use AI (Haiku for speed)
        return self._generate_ai_response(intent, workflow_result, message)

    def _is_simple_template(self, template: str) -> bool:
        """Check if template can use quick response"""
        simple_templates = [
            "greeting",
            "flight_search_results",
            "hotel_search_results",
            "booking_created",
            "traveler_added",
            "flight_added",
            "hotel_added"
        ]
        return template in simple_templates

    def _generate_simple_response(
        self,
        intent: Dict[str, Any],
        workflow_result: Dict[str, Any],
        template: str
    ) -> str:
        """Generate response using templates (fast, no AI cost)"""
        data = workflow_result.get("data", {})

        if template == "greeting":
            return "Welcome to the AI Booking Assistant. I can help you create and manage travel bookings efficiently.\n\nPlease provide details about your trip including destination, dates, number of travelers, and any specific requirements."

        elif template == "flight_search_results":
            flights = data or []
            if not flights:
                return "I couldn't find any flights matching your criteria. Would you like to try different dates or destinations?"

            params = intent.get("params", {})
            count = len(flights)
            destination = params.get("destination", "your destination")

            response = f"I found {count} flight options to {destination}.\n\n"
            response += "Here are the top results:\n\n"

            for i, flight in enumerate(flights[:3], 1):
                response += f"{i}. {flight['route']} - {flight['price']}\n"
                response += f"   Departure: {flight['departure']}\n"
                response += f"   Duration: {flight['duration']}, Stops: {flight['stops']}\n\n"

            response += "Would you like to add any of these flights to your booking?"
            return response

        elif template == "hotel_search_results":
            hotels = data or []
            if not hotels:
                return "I couldn't find any hotels matching your criteria. Would you like to try a different location or dates?"

            count = len(hotels)
            response = f"I found {count} hotel options.\n\n"
            response += "Here are the top results:\n\n"

            for i, hotel in enumerate(hotels[:3], 1):
                rating = hotel.get('rating', 'N/A')
                response += f"{i}. {hotel['name']} ({rating} stars)\n"
                response += f"   Distance: {hotel.get('distance', 'N/A')} km\n\n"

            response += "Would you like to add any of these hotels to your booking?"
            return response

        elif template == "booking_created":
            booking_code = data.get("booking_code", "")
            return f"Booking created successfully!\n\nBooking Code: {booking_code}\n\nWhat would you like to add to this booking? (flights, hotels, travelers)"

        elif template == "traveler_added":
            return "Traveler added successfully to your booking!"

        elif template == "flight_added":
            return "Flight added to your booking successfully!"

        elif template == "hotel_added":
            return "Hotel added to your booking successfully!"

        # Default fallback
        return "Operation completed successfully."

    def _generate_ai_response(
        self,
        intent: Dict[str, Any],
        workflow_result: Dict[str, Any],
        message: str
    ) -> str:
        """Generate response using AI (Haiku for speed)"""
        # Build context for AI
        context = {
            "user_message": message,
            "intent": intent.get("intent"),
            "success": workflow_result.get("success"),
            "error": workflow_result.get("error"),
            "data": workflow_result.get("data")
        }

        system_prompt = """You are a professional travel booking assistant. Generate a natural, helpful response based on the workflow result.

Guidelines:
- Be professional and concise
- If the operation succeeded, confirm and suggest next steps
- If there was an error, explain clearly and offer alternatives
- Always be helpful and friendly
- Keep responses under 3-4 sentences for simple operations
- Format structured data (like lists) clearly"""

        user_prompt = f"""Generate a natural language response for this interaction:

User message: {message}
Intent detected: {intent.get('intent')}
Operation successful: {workflow_result.get('success')}
{f"Error: {workflow_result.get('error')}" if workflow_result.get('error') else ""}

Workflow result: {json.dumps(workflow_result, default=str, indent=2)}

Generate a helpful response:"""

        try:
            response = self.client.messages.create(
                model=self.haiku,
                max_tokens=500,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )

            return response.content[0].text.strip()

        except Exception as e:
            # Fallback to simple response
            if workflow_result.get("success"):
                return "Operation completed successfully. How else can I help you?"
            else:
                error = workflow_result.get("error", "Unknown error")
                return f"I encountered an issue: {error}. Please try again or rephrase your request."

    def _get_conversation_context(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get context from previous messages in conversation"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Get recent messages
            cursor.execute("""
                SELECT message, role, created_at
                FROM conversation_messages
                WHERE conversation_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            """, (conversation_id,))

            messages = cursor.fetchall()
            conn.close()

            if not messages:
                return None

            # Build context
            return {
                "message_count": len(messages),
                "recent_messages": [
                    {"role": msg["role"], "content": msg["message"]}
                    for msg in messages
                ]
            }

        except Exception:
            return None

    def _save_message(
        self,
        conversation_id: str,
        user_message: str,
        assistant_message: str,
        intent: Dict[str, Any],
        workflow_result: Dict[str, Any]
    ) -> Optional[str]:
        """Save conversation messages to database"""
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Save user message
            cursor.execute("""
                INSERT INTO conversation_messages
                (conversation_id, message, role, intent, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                conversation_id,
                user_message,
                "user",
                intent.get("intent"),
                datetime.now().isoformat()
            ))

            # Save assistant message
            cursor.execute("""
                INSERT INTO conversation_messages
                (conversation_id, message, role, workflow_result, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                conversation_id,
                assistant_message,
                "assistant",
                json.dumps(workflow_result),
                datetime.now().isoformat()
            ))

            message_id = cursor.lastrowid

            conn.commit()
            conn.close()

            return str(message_id)

        except Exception as e:
            print(f"Error saving message: {e}")
            return None
