"""
AI Chat routes (Booking Assistant)
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user

router = APIRouter()


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


@router.post("/message")
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send message to AI booking assistant"""
    # TODO: Implement AI chat with Claude
    return {
        "message": "AI chat functionality coming soon",
        "conversation_id": request.conversation_id
    }


@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for user"""
    # TODO: Implement conversation listing
    return {"conversations": []}


@router.post("/conversations")
async def create_conversation(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new conversation"""
    # TODO: Implement conversation creation
    return {
        "conversation_id": request.conversation_id or "conv_new",
        "message": "Conversation creation coming soon"
    }
