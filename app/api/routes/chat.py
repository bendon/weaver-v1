"""
AI Chat routes (Booking Assistant)
"""

import re
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    create_conversation, get_conversation, get_conversations_by_user,
    update_conversation, add_conversation_message, get_conversation_messages,
    create_shared_session, get_conversation_by_session_token,
    invalidate_shared_session, extend_shared_session
)

router = APIRouter()

# Initialize AI assistant (lazy initialization - only when needed)
_assistant = None
_assistant_error = None
_BookingAssistant = None


def generate_conversation_title(message: str, booking_id: Optional[str] = None) -> str:
    """Generate a concise title from the first user message with key details"""
    # Safety check: ensure message is a valid string
    if not message or not isinstance(message, str):
        return 'New Conversation'
    
    # If there's a booking_id, get booking details for better title
    if booking_id:
        try:
            from app.core.database import get_booking_by_id
            booking = get_booking_by_id(booking_id)
            if booking:
                return booking.get('title', 'Travel Booking')
        except Exception as e:
            print(f"Error getting booking for title: {e}")
            # Continue with message-based title generation

    # Extract key information from message
    message_lower = message.lower()
    message_original = message  # Keep original for case-sensitive extraction

    # Extract key details using patterns
    details = []
    
    # Extract origin and destination for flights
    origin = None
    destination = None
    
    # Patterns: "from X to Y", "X to Y", "flying from X to Y", "departing X to Y"
    flight_patterns = [
        r'(?:from|departing|leaving)\s+([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s|,|$|departing|on|for)',
        r'(?:from|departing|leaving)\s+([A-Za-z\s]+?)\s+(?:→|->)\s+([A-Za-z\s]+?)(?:\s|,|$|departing|on|for)',
        r'([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s|,|$|departing|on|for)',
        r'flight\s+(?:from\s+)?([A-Za-z\s]+?)\s+to\s+([A-Za-z\s]+?)(?:\s|,|$|departing|on|for)',
    ]
    
    for pattern in flight_patterns:
        match = re.search(pattern, message_lower, re.IGNORECASE)
        if match:
            origin = match.group(1).strip()
            destination = match.group(2).strip()
            # Clean up common words
            origin = re.sub(r'\b(?:from|departing|leaving|city|airport)\b', '', origin, flags=re.IGNORECASE).strip()
            destination = re.sub(r'\b(?:to|going|city|airport)\b', '', destination, flags=re.IGNORECASE).strip()
            if origin and destination and len(origin) < 30 and len(destination) < 30:
                break
    
    # Extract number of passengers/travelers
    passengers = None
    passenger_patterns = [
        r'(\d+)\s*(?:passenger|traveler|person|people|pax|adult|guest)',
        r'for\s+(\d+)\s*(?:people|person|traveler|passenger|pax)',
    ]
    for pattern in passenger_patterns:
        match = re.search(pattern, message_lower)
        if match:
            passengers = match.group(1)
            break
    
    # Extract dates
    departure_date = None
    return_date = None
    
    # Date patterns: "on March 15", "departing 2025-03-15", "March 15, 2025", etc.
    date_patterns = [
        r'(?:departing|leaving|on|start(?:ing)?)\s+(\d{4}-\d{2}-\d{2})',
        r'(?:departing|leaving|on|start(?:ing)?)\s+([A-Za-z]+\s+\d{1,2}(?:,\s+\d{4})?)',
        r'(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)',  # MM/DD/YYYY or DD/MM/YYYY
    ]
    
    for pattern in date_patterns:
        matches = re.findall(pattern, message_lower)
        if matches:
            departure_date = matches[0]
            if len(matches) > 1:
                return_date = matches[1]
            break
    
    # Extract return date separately
    if not return_date:
        return_patterns = [
            r'return(?:ing)?\s+(?:on\s+)?(\d{4}-\d{2}-\d{2})',
            r'return(?:ing)?\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2}(?:,\s+\d{4})?)',
        ]
        for pattern in return_patterns:
            match = re.search(pattern, message_lower)
            if match:
                return_date = match.group(1)
                break
    
    # Build title based on type
    if 'flight' in message_lower or origin or destination:
        title_parts = ['✈️']
        if origin and destination:
            # Shorten city names if too long
            origin_short = origin.split()[0] if len(origin) > 15 else origin
            dest_short = destination.split()[0] if len(destination) > 15 else destination
            title_parts.append(f"{origin_short.title()} → {dest_short.title()}")
        else:
            title_parts.append('Flight Booking')
        
        # Add passengers
        if passengers:
            title_parts.append(f"({passengers} pax)")
        
        # Add dates (short format)
        if departure_date:
            try:
                # Try to parse and format date
                if '-' in departure_date and len(departure_date) == 10:
                    date_obj = datetime.strptime(departure_date, '%Y-%m-%d')
                    date_str = date_obj.strftime('%b %d')
                else:
                    date_str = departure_date[:10]
                title_parts.append(date_str)
            except:
                title_parts.append(departure_date[:10])
        
        return ' '.join(title_parts)
    
    elif 'hotel' in message_lower:
        title_parts = ['🏨 Hotel']
        if destination:
            dest_short = destination.split()[0] if len(destination) > 15 else destination
            title_parts.append(dest_short.title())
        if passengers:
            title_parts.append(f"({passengers} pax)")
        return ' '.join(title_parts) if len(title_parts) > 1 else '🏨 Hotel Reservation'
    
    elif 'safari' in message_lower or 'kenya' in message_lower:
        title_parts = ['🦁 Safari']
        if passengers:
            title_parts.append(f"({passengers} pax)")
        if departure_date:
            try:
                if '-' in departure_date and len(departure_date) == 10:
                    date_obj = datetime.strptime(departure_date, '%Y-%m-%d')
                    title_parts.append(date_obj.strftime('%b %d'))
            except:
                pass
        return ' '.join(title_parts) if len(title_parts) > 1 else '🦁 Safari Adventure'
    
    elif 'beach' in message_lower or 'maldives' in message_lower or 'resort' in message_lower:
        title_parts = ['🏖️ Beach']
        if destination:
            dest_short = destination.split()[0] if len(destination) > 15 else destination
            title_parts.append(dest_short.title())
        if passengers:
            title_parts.append(f"({passengers} pax)")
        return ' '.join(title_parts) if len(title_parts) > 1 else '🏖️ Beach Getaway'
    
    elif 'trip' in message_lower or 'vacation' in message_lower or 'travel' in message_lower:
        title_parts = ['✈️']
        if destination:
            dest_short = destination.split()[0] if len(destination) > 20 else destination
            title_parts.append(dest_short.title())
        elif origin:
            origin_short = origin.split()[0] if len(origin) > 20 else origin
            title_parts.append(origin_short.title())
        else:
            # Extract first few meaningful words
            words = [w for w in message.split()[:6] if w.lower() not in ['i', 'need', 'want', 'book', 'a', 'an', 'the', 'to', 'for']]
            if words:
                truncated = ' '.join(words[:4])
                title_parts.append(truncated.capitalize())
        if passengers:
            title_parts.append(f"({passengers} pax)")
        return ' '.join(title_parts) if len(title_parts) > 1 else '✈️ Trip Planning'

    # Default: use first meaningful words (skip common words)
    words = message.split()
    meaningful_words = [w for w in words[:6] if w.lower() not in ['i', 'need', 'want', 'book', 'a', 'an', 'the', 'to', 'for', 'please']]
    if meaningful_words:
        truncated = ' '.join(meaningful_words[:5])
        if len(message.split()) > 5:
            truncated += '...'
        return truncated.capitalize()
    
    # Fallback: first 40 characters
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
        
        # Prevent adding messages to completed or abandoned conversations
        if conversation.get('status') in ['completed', 'abandoned']:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot add messages to a {conversation.get('status')} conversation. Please start a new conversation."
            )

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
        try:
            result = await assistant.chat(
                message=request.message,
                conversation_history=claude_messages,
                organization_id=current_user['organization_id'],
                user_id=current_user['id']
            )
        except Exception as chat_error:
            print(f"Error calling assistant.chat: {chat_error}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to get AI response: {str(chat_error)}")

        # Validate result structure
        if not result or not isinstance(result, dict):
            print(f"Invalid result from assistant: {result}")
            raise HTTPException(status_code=500, detail="Invalid response from AI assistant")
        
        if 'response' not in result:
            print(f"Missing 'response' in result: {result}")
            raise HTTPException(status_code=500, detail="AI assistant did not return a response")

        # Save user message to database
        try:
            user_message_id = add_conversation_message(
                conversation_id=conversation_id,
                role='user',
                content=request.message
            )
        except Exception as msg_error:
            print(f"Error saving user message: {msg_error}")
            import traceback
            traceback.print_exc()
            # Continue even if saving user message fails

        # Generate and save conversation title from first user message
        if len(messages) == 0 or (len(messages) == 1 and messages[0]['role'] == 'system'):
            # This is the first user message, generate a title
            try:
                title = generate_conversation_title(request.message)
                update_conversation(conversation_id, title=title)
            except Exception as title_error:
                print(f"Error generating conversation title: {title_error}")
                import traceback
                traceback.print_exc()
                # Use a fallback title if generation fails
                title = request.message[:40] + ('...' if len(request.message) > 40 else '')
                try:
                    update_conversation(conversation_id, title=title)
                except Exception as update_error:
                    print(f"Error updating conversation title: {update_error}")

        # Save assistant response to database
        assistant_message_id = None
        try:
            assistant_message_id = add_conversation_message(
                conversation_id=conversation_id,
                role='assistant',
                content=result['response'],
                tool_calls=result.get('tool_calls')
            )
            if not assistant_message_id:
                print("Warning: add_conversation_message returned None, using fallback ID")
                assistant_message_id = f"msg-{conversation_id}-{int(time.time())}"
        except Exception as msg_error:
            print(f"Error saving assistant message: {msg_error}")
            import traceback
            traceback.print_exc()
            # Create a fallback message ID
            assistant_message_id = f"msg-{conversation_id}-{int(time.time())}"
        
        # Ensure we have a valid message ID
        if not assistant_message_id:
            assistant_message_id = f"msg-{conversation_id}-{int(time.time())}"

        # Check if a booking was created and link it (and update title + stage)
        # Also mark conversation as active when booking process starts
        booking_created = False
        for tool_call in result.get('tool_calls', []):
            if tool_call['name'] == 'create_booking' and tool_call['result'].get('success'):
                booking_id = tool_call['result']['booking_id']
                # Update title with booking title if available
                try:
                    title = generate_conversation_title(request.message, booking_id)
                except Exception as title_error:
                    print(f"Error generating conversation title with booking: {title_error}")
                    import traceback
                    traceback.print_exc()
                    # Use a fallback title if generation fails
                    title = request.message[:40] + ('...' if len(request.message) > 40 else '')
                # Update stage to booking_in_progress and status to active
                update_conversation(conversation_id, booking_id=booking_id, title=title, stage='booking_in_progress', status='active')
                booking_created = True

            # If flight or hotel was added, also update stage
            elif tool_call['name'] in ['add_flight_to_booking', 'add_hotel_to_booking'] and tool_call['result'].get('success'):
                # Get current conversation to check stage
                conv = get_conversation(conversation_id)
                if conv and conv.get('stage') == 'lead':
                    update_conversation(conversation_id, stage='qualified', status='active')
        
        # Mark conversation as active if any booking-related tool was called (search_flights, add_traveler, etc.)
        if not booking_created and len(result.get('tool_calls', [])) > 0:
            # Check if any tool indicates booking process has started
            booking_tools = ['search_flights', 'search_hotels', 'add_traveler', 'add_flight_to_booking', 
                           'add_hotel_to_booking', 'add_transfer', 'add_activity']
            if any(tc['name'] in booking_tools for tc in result.get('tool_calls', [])):
                conversation = get_conversation(conversation_id)
                if conversation and conversation.get('status') != 'active':
                    update_conversation(conversation_id, status='active')

        # Ensure all required fields are present and valid
        try:
            # Safely serialize tool_calls
            tool_calls = result.get('tool_calls', [])
            if not isinstance(tool_calls, list):
                tool_calls = []
            
            # Ensure tool_calls are JSON-serializable
            import json
            try:
                # Test if tool_calls can be serialized
                json.dumps(tool_calls, default=str)
            except (TypeError, ValueError) as json_error:
                print(f"Warning: tool_calls not JSON serializable, converting: {json_error}")
                # Convert to a safe format - ensure all nested objects are serializable
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
                "message_id": str(assistant_message_id) if assistant_message_id else f"msg-{conversation_id}-{int(time.time())}",
                "response": str(result.get('response', '')),
                "tool_calls": tool_calls
            }
            
            # Validate response data before returning
            if not response_data['conversation_id']:
                raise HTTPException(status_code=500, detail="Missing conversation_id in response")
            
            if not response_data['response']:
                print("Warning: Empty response from AI assistant")
                response_data['response'] = "I apologize, but I didn't receive a proper response. Please try again."
            
            # Final validation - ensure everything is JSON serializable
            try:
                # Test full response serialization
                json_str = json.dumps(response_data, default=str, ensure_ascii=False)
                # Parse it back to ensure it's valid
                json.loads(json_str)
            except Exception as final_check_error:
                print(f"Error: Response not JSON serializable: {final_check_error}")
                import traceback
                traceback.print_exc()
                # Return minimal safe response
                response_data = {
                    "conversation_id": str(conversation_id),
                    "message_id": str(assistant_message_id) if assistant_message_id else f"msg-{conversation_id}-{int(time.time())}",
                    "response": str(result.get('response', 'Error: Response serialization failed')),
                    "tool_calls": []
                }
            
            # Log the response we're about to return (for debugging)
            print(f"Returning response: conversation_id={response_data['conversation_id']}, message_id={response_data['message_id']}, response_length={len(response_data['response'])}, tool_calls_count={len(tool_calls)}")
            
            return response_data
        except Exception as response_error:
            print(f"Error building response data: {response_error}")
            import traceback
            traceback.print_exc()
            # Return a minimal valid response
            return {
                "conversation_id": str(conversation_id),
                "message_id": f"msg-{conversation_id}-{int(time.time())}",
                "response": str(result.get('response', 'Error processing response')),
                "tool_calls": []
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        import traceback
        traceback.print_exc()
        # Ensure we return a proper HTTPException with JSON response
        error_detail = str(e) if str(e) else "Internal Server Error"
        raise HTTPException(status_code=500, detail=error_detail)


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


# ============================================================
# SHARED SESSIONS (Public Links)
# ============================================================

class ShareConversationRequest(BaseModel):
    expires_in_hours: Optional[int] = 168  # Default: 7 days


class ShareConversationResponse(BaseModel):
    success: bool
    session_token: Optional[str] = None
    share_url: Optional[str] = None
    expires_at: Optional[str] = None
    error: Optional[str] = None


@router.post("/conversations/{conversation_id}/share")
async def share_conversation(
    conversation_id: str,
    request: ShareConversationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a shareable public link for a conversation.
    This allows DMCs to share conversations with clients.
    """
    try:
        # Get conversation and verify ownership
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify user has access to this conversation
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Create or regenerate session token
        session_token = create_shared_session(
            conversation_id,
            expires_in_hours=request.expires_in_hours
        )

        if not session_token:
            raise HTTPException(
                status_code=500,
                detail="Failed to create shared session"
            )

        # Build share URL (frontend will be at /s/{token})
        # In production, use request.base_url or settings.FRONTEND_URL
        share_url = f"/s/{session_token}"

        # Get updated conversation to get expires_at
        updated_conv = get_conversation(conversation_id)

        return ShareConversationResponse(
            success=True,
            session_token=session_token,
            share_url=share_url,
            expires_at=updated_conv.get('session_expires_at')
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sharing conversation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}/share")
async def revoke_shared_session(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Revoke/invalidate a shared session"""
    try:
        # Get conversation and verify ownership
        conversation = get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Verify access
        if conversation['organization_id'] != current_user['organization_id']:
            raise HTTPException(status_code=403, detail="Access denied")

        success = invalidate_shared_session(conversation_id)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to revoke shared session"
            )

        return {"success": True, "message": "Shared session revoked"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking shared session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
