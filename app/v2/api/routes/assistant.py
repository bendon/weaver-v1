"""
WeaverAssistant API Routes
Chat interface for AI assistant
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.v2.core.security import get_current_user
from app.v2.weaver_assistant.service import weaver_assistant_service

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message from user"""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")


class ChatResponse(BaseModel):
    """Response from WeaverAssistant"""
    success: bool
    conversation_id: Optional[str]
    intent: Dict[str, Any]
    response: Dict[str, Any]
    requires_confirmation: bool = False
    next_step: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def send_message(
    message: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """
    Send message to WeaverAssistant

    Flow:
    1. User sends natural language message
    2. Intent recognition extracts structured data
    3. Automation executes business logic
    4. Response formatted with template
    5. Returns structured response with actions
    """
    try:
        result = await weaver_assistant_service.process_message(
            user_id=current_user["id"],
            message=message.message,
            conversation_id=message.conversation_id,
            organization_id=current_user.get("organization_id")
        )

        return ChatResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing message: {str(e)}"
        )


@router.get("/conversations")
async def list_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    List user's conversations
    """
    try:
        from app.v2.core.database import get_mongo_db
        db = get_mongo_db()

        if not db:
            return {
                "success": False,
                "data": [],
                "message": "Database not available"
            }

        conversations = list(
            db.conversations.find(
                {"user_id": current_user["id"]},
                {"messages": 0}  # Exclude messages for list view
            ).sort("last_activity", -1).limit(50)
        )

        # Convert ObjectId to string
        for conv in conversations:
            conv["id"] = str(conv.pop("_id"))

        return {
            "success": True,
            "data": conversations,
            "message": f"Found {len(conversations)} conversations"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get conversation details with full message history
    """
    try:
        from app.v2.core.database import get_mongo_db
        db = get_mongo_db()

        if not db:
            raise HTTPException(status_code=503, detail="Database not available")

        conversation = db.conversations.find_one({
            "_id": conversation_id,
            "user_id": current_user["id"]
        })

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        conversation["id"] = str(conversation.pop("_id"))

        return {
            "success": True,
            "data": conversation
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching conversation: {str(e)}"
        )


@router.post("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Archive a conversation
    """
    try:
        from app.v2.core.database import get_mongo_db
        db = get_mongo_db()

        if not db:
            raise HTTPException(status_code=503, detail="Database not available")

        result = db.conversations.update_one(
            {"_id": conversation_id, "user_id": current_user["id"]},
            {"$set": {"status": "archived"}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {
            "success": True,
            "message": "Conversation archived"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error archiving conversation: {str(e)}"
        )
