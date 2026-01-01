"""
Public Shared Session routes
These endpoints do NOT require authentication - they use session tokens instead
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.database import (
    get_conversation_by_session_token,
    get_conversation_messages,
    add_conversation_message,
    get_organization_by_id
)

router = APIRouter()

# Lazy initialization for AI assistant
_assistant = None
_assistant_error = None
_BookingAssistant = None


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


class SharedSessionResponse(BaseModel):
    """Response for getting shared session"""
    success: bool
    conversation: Optional[Dict[str, Any]] = None
    messages: Optional[list] = None
    organization: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class SharedSessionMessageRequest(BaseModel):
    """Request to send message in shared session"""
    message: str


@router.get("/s/{session_token}")
async def get_shared_session(session_token: str):
    """
    Get shared conversation (PUBLIC - no auth required)
    Validates session token and expiration
    """
    try:
        # Get conversation by session token (validates expiration)
        conversation = get_conversation_by_session_token(session_token)

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Session not found or expired"
            )

        # Get messages
        messages = get_conversation_messages(conversation['id'])

        # Get organization details for branding
        organization = None
        if conversation.get('organization_id'):
            organization = get_organization_by_id(conversation['organization_id'])
            if organization:
                # Only expose safe fields to public
                organization = {
                    'name': organization.get('name'),
                    'logo_url': organization.get('logo_url'),
                    'contact_phone': organization.get('contact_phone'),
                    'contact_email': organization.get('contact_email'),
                }

        # Sanitize conversation (remove sensitive fields)
        safe_conversation = {
            'id': conversation['id'],
            'title': conversation.get('title', 'Conversation'),
            'created_at': conversation.get('created_at'),
            'updated_at': conversation.get('updated_at'),
            'status': conversation.get('status'),
        }

        return SharedSessionResponse(
            success=True,
            conversation=safe_conversation,
            messages=messages,
            organization=organization
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shared session: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/s/{session_token}/message")
async def send_shared_session_message(
    session_token: str,
    request: SharedSessionMessageRequest
):
    """
    Send message in shared session (PUBLIC - no auth required)
    Client can reply to the conversation via the shared link
    """
    try:
        # Get conversation by session token (validates expiration)
        conversation = get_conversation_by_session_token(session_token)

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Session not found or expired"
            )

        conversation_id = conversation['id']

        # Check if conversation is in a state that allows messages
        if conversation.get('status') in ['completed', 'abandoned']:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add messages to a {conversation.get('status')} conversation"
            )

        # Get AI assistant
        assistant = get_assistant()
        if not assistant:
            error_msg = "AI assistant is not configured."
            if _assistant_error:
                error_msg += f" Error: {_assistant_error}"
            raise HTTPException(status_code=503, detail=error_msg)

        # Get conversation history
        messages = get_conversation_messages(conversation_id)

        # Convert to Claude format
        claude_messages = []
        for msg in messages:
            if msg['role'] in ['user', 'assistant']:
                claude_messages.append({
                    "role": msg['role'],
                    "content": msg['content']
                })

        # Send message to Claude
        try:
            result = await assistant.chat(
                message=request.message,
                conversation_history=claude_messages,
                organization_id=conversation['organization_id'],
                user_id=conversation.get('user_id')
            )
        except Exception as chat_error:
            print(f"Error calling assistant.chat: {chat_error}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get AI response: {str(chat_error)}"
            )

        # Validate result
        if not result or not isinstance(result, dict) or 'response' not in result:
            raise HTTPException(
                status_code=500,
                detail="Invalid response from AI assistant"
            )

        # Save user message
        try:
            user_message_id = add_conversation_message(
                conversation_id=conversation_id,
                role='user',
                content=request.message
            )
        except Exception as msg_error:
            print(f"Error saving user message: {msg_error}")
            # Continue even if saving fails

        # Save assistant response
        try:
            assistant_message_id = add_conversation_message(
                conversation_id=conversation_id,
                role='assistant',
                content=result['response'],
                tool_calls=result.get('tool_calls')
            )

            if not assistant_message_id:
                import time
                assistant_message_id = f"msg-{conversation_id}-{int(time.time())}"
        except Exception as msg_error:
            print(f"Error saving assistant message: {msg_error}")
            import time
            assistant_message_id = f"msg-{conversation_id}-{int(time.time())}"

        # Ensure tool_calls are JSON-serializable
        import json
        tool_calls = result.get('tool_calls', [])
        if not isinstance(tool_calls, list):
            tool_calls = []

        try:
            json.dumps(tool_calls, default=str)
        except (TypeError, ValueError):
            # Convert to safe format
            safe_tool_calls = []
            for tc in tool_calls:
                if isinstance(tc, dict):
                    safe_tc = {
                        "name": str(tc.get('name', 'unknown')),
                        "arguments": tc.get('arguments', {}),
                        "result": json.loads(json.dumps(tc.get('result', {}), default=str)) if tc.get('result') else {}
                    }
                    safe_tool_calls.append(safe_tc)
                else:
                    safe_tool_calls.append(str(tc))
            tool_calls = safe_tool_calls

        response_data = {
            "conversation_id": str(conversation_id),
            "message_id": str(assistant_message_id),
            "response": str(result.get('response', '')),
            "tool_calls": tool_calls
        }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in shared session message: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
