"""
AI Chat routes (Booking Assistant)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    create_conversation, get_conversation, get_conversations_by_user,
    update_conversation, add_conversation_message, get_conversation_messages
)

router = APIRouter()

# Initialize AI assistant (lazy initialization - only when needed)
_assistant = None
_assistant_error = None
_BookingAssistant = None


def generate_conversation_title(message: str, booking_id: Optional[str] = None) -> str:
    """Generate a concise title from the first user message"""
    # If there's a booking_id, get booking details for better title
    if booking_id:
        from app.core.database import get_booking_by_id
        booking = get_booking_by_id(booking_id)
        if booking:
            return booking.get('title', 'Travel Booking')

    # Extract key information from message
    message_lower = message.lower()

    # Common patterns
    if 'tokyo' in message_lower or 'japan' in message_lower:
        return '🗾 Tokyo Trip Planning'
    elif 'paris' in message_lower or 'france' in message_lower:
        return '🗼 Paris Trip Planning'
    elif 'london' in message_lower or 'uk' in message_lower or 'england' in message_lower:
        return '🇬🇧 London Trip Planning'
    elif 'safari' in message_lower or 'kenya' in message_lower:
        return '🦁 Safari Adventure'
    elif 'maldives' in message_lower or 'beach' in message_lower or 'resort' in message_lower:
        return '🏖️ Beach Getaway'
    elif 'ski' in message_lower or 'alps' in message_lower or 'mountain' in message_lower:
        return '🎿 Mountain Retreat'
    elif 'new york' in message_lower or 'nyc' in message_lower:
        return '🗽 New York Trip'
    elif 'dubai' in message_lower:
        return '🏙️ Dubai Adventure'

    # Generic patterns
    elif 'flight' in message_lower:
        return '✈️ Flight Booking'
    elif 'hotel' in message_lower:
        return '🏨 Hotel Reservation'
    elif 'trip' in message_lower or 'vacation' in message_lower or 'travel' in message_lower:
        # Extract first few words
        words = message.split()[:5]
        truncated = ' '.join(words)
        if len(message.split()) > 5:
            truncated += '...'
        return f'✈️ {truncated.capitalize()}'

    # Default: use first 40 characters
    if len(message) > 40:
        return message[:37] + '...'
    return message

def get_assistant():
    """Get or initialize the AI assistant (lazy initialization)"""
    global _assistant, _assistant_error, _BookingAssistant
    
    if _assistant is not None:
        return _assistant
    
    if _assistant_error:
        return None
    
    try:
        if _BookingAssistant is None:
            from app.ai_assistant import BookingAssistant as BookingAssistantClass
            _BookingAssistant = BookingAssistantClass
        
        _assistant = _BookingAssistant()
        print("✓ AI Assistant initialized successfully")
        return _assistant
    except ImportError as e:
        _assistant_error = f"anthropic package not installed: {e}"
        print(f"Warning: {_assistant_error}")
        return None
    except Exception as e:
        _assistant_error = str(e)
        print(f"Warning: Could not initialize AI assistant: {e}")
        import traceback
        traceback.print_exc()
        return None


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ConversationResponse(BaseModel):
    conversation_id: str
    status: str
    created_at: str
    updated_at: str
    booking_id: Optional[str] = None


@router.post("/message")
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send message to AI booking assistant"""

    # Lazy initialize assistant on first use
    assistant = get_assistant()
    if not assistant:
        error_msg = "AI assistant is not configured."
        if _assistant_error:
            error_msg += f" Error: {_assistant_error}"
        else:
            error_msg += " Please set ANTHROPIC_API_KEY environment variable."
        raise HTTPException(
            status_code=503,
            detail=error_msg
        )

    try:
        # Get or create conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            # Create new conversation
            conversation_id = create_conversation(
                organization_id=current_user['organization_id'],
                user_id=current_user['id'],
                conversation_type='booking'
            )

            if not conversation_id:
                raise HTTPException(status_code=500, detail="Failed to create conversation")

        # Get existing conversation to verify access
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify user has access to this conversation
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get conversation history
        messages = get_conversation_messages(conversation_id)

        # Convert database messages to Claude format
        claude_messages = []
        for msg in messages:
            if msg['role'] in ['user', 'assistant']:
                claude_messages.append({
                    "role": msg['role'],
                    "content": msg['content']
                })

        # Send message to Claude
        result = await assistant.chat(
            message=request.message,
            conversation_history=claude_messages,
            organization_id=current_user['organization_id'],
            user_id=current_user['id']
        )

        # Save user message to database
        user_message_id = add_conversation_message(
            conversation_id=conversation_id,
            role='user',
            content=request.message
        )

        # Generate and save conversation title from first user message
        if len(messages) == 0 or (len(messages) == 1 and messages[0]['role'] == 'system'):
            # This is the first user message, generate a title
            title = generate_conversation_title(request.message)
            update_conversation(conversation_id, title=title)

        # Save assistant response to database
        assistant_message_id = add_conversation_message(
            conversation_id=conversation_id,
            role='assistant',
            content=result['response'],
            tool_calls=result.get('tool_calls')
        )

        # Check if a booking was created and link it (and update title + stage)
        for tool_call in result.get('tool_calls', []):
            if tool_call['name'] == 'create_booking' and tool_call['result'].get('success'):
                booking_id = tool_call['result']['booking_id']
                # Update title with booking title if available
                title = generate_conversation_title(request.message, booking_id)
                # Update stage to booking_in_progress
                update_conversation(conversation_id, booking_id=booking_id, title=title, stage='booking_in_progress')

            # If flight or hotel was added, also update stage
            elif tool_call['name'] in ['add_flight_to_booking', 'add_hotel_to_booking'] and tool_call['result'].get('success'):
                # Get current conversation to check stage
                conv = get_conversation(conversation_id)
                if conv and conv.get('stage') == 'lead':
                    update_conversation(conversation_id, stage='qualified')

        return {
            "conversation_id": conversation_id,
            "message_id": assistant_message_id,
            "response": result['response'],
            "tool_calls": result.get('tool_calls', [])
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for user"""
    try:
        conversations = get_conversations_by_user(
            user_id=current_user['id'],
            organization_id=current_user['organization_id']
        )
        return {
            "conversations": conversations,
            "total": len(conversations)
        }
    except Exception as e:
        print(f"Error getting conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}")
async def get_conversation_detail(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation by ID with all messages"""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify access
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get messages
        messages = get_conversation_messages(conversation_id)

        return {
            "conversation": conversation,
            "messages": messages
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conversations")
async def create_conversation_endpoint(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation"""
    try:
        conversation_id = create_conversation(
            organization_id=current_user['organization_id'],
            user_id=current_user['id'],
            conversation_type='booking'
        )

        if not conversation_id:
            raise HTTPException(status_code=500, detail="Failed to create conversation")

        return {
            "conversation_id": conversation_id,
            "message": "Conversation created successfully"
        }
    except Exception as e:
        print(f"Error creating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify access
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Update status to deleted
        update_conversation(conversation_id, status='deleted')

        return {"success": True, "message": "Conversation deleted"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class UpdateConversationRequest(BaseModel):
    stage: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    tags: Optional[str] = None


@router.patch("/conversations/{conversation_id}")
async def update_conversation_endpoint(
    conversation_id: str,
    request: UpdateConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update conversation stage, outcome, follow-up, etc."""
    try:
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify access
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Build update dict
        updates = {}
        if request.stage:
            updates['stage'] = request.stage
        if request.outcome:
            updates['outcome'] = request.outcome
        if request.status:
            updates['status'] = request.status
        if request.follow_up_date is not None:  # Allow empty string to clear
            updates['follow_up_date'] = request.follow_up_date
        if request.follow_up_notes is not None:
            updates['follow_up_notes'] = request.follow_up_notes
        if request.tags is not None:
            updates['tags'] = request.tags

        # If follow_up_date is set, auto-update stage
        if request.follow_up_date and request.follow_up_date.strip():
            updates['stage'] = 'follow_up_scheduled'

        # If outcome is 'booked', update stage to booking_completed
        if request.outcome == 'booked':
            updates['stage'] = 'booking_completed'
            updates['status'] = 'completed'
        elif request.outcome in ['declined', 'no_response']:
            updates['stage'] = 'no_sale'
            updates['status'] = 'completed'

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        success = update_conversation(conversation_id, **updates)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update conversation")

        # Get updated conversation
        updated_conv = get_conversation(conversation_id)

        return {
            "success": True,
            "message": "Conversation updated successfully",
            "conversation": updated_conv
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
