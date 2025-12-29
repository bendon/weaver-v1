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
from app.ai_assistant import BookingAssistant

router = APIRouter()

# Initialize AI assistant
try:
    assistant = BookingAssistant()
except Exception as e:
    print(f"Warning: Could not initialize AI assistant: {e}")
    assistant = None


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

    if not assistant:
        raise HTTPException(
            status_code=503,
            detail="AI assistant is not configured. Please set ANTHROPIC_API_KEY environment variable."
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

        # Save assistant response to database
        assistant_message_id = add_conversation_message(
            conversation_id=conversation_id,
            role='assistant',
            content=result['response'],
            tool_calls=result.get('tool_calls')
        )

        # Check if a booking was created and link it
        for tool_call in result.get('tool_calls', []):
            if tool_call['name'] == 'create_booking' and tool_call['result'].get('success'):
                booking_id = tool_call['result']['booking_id']
                update_conversation(conversation_id, booking_id=booking_id)

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
