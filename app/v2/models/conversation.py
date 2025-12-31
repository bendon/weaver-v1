"""
Conversation models for WeaverAssistant
Handles chat messages and conversation threads
"""

from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.v2.models.base import MongoBaseModel, APIBaseModel


class Message(APIBaseModel):
    """Single message in a conversation"""
    role: str = Field(..., description="Message role: user, assistant, or system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")


class Conversation(MongoBaseModel):
    """Conversation thread with WeaverAssistant"""
    user_id: str = Field(..., description="User who owns this conversation")
    organization_id: Optional[str] = Field(None, description="Organization context")
    title: str = Field(default="New Conversation", description="Conversation title")
    messages: List[Message] = Field(default_factory=list, description="Conversation messages")
    context: Dict[str, Any] = Field(default_factory=dict, description="Conversation context")
    status: str = Field(default="active", description="Conversation status: active, archived")
    last_activity: datetime = Field(default_factory=datetime.utcnow)


class ConversationCreate(APIBaseModel):
    """Request to create a new conversation"""
    title: Optional[str] = Field(None, description="Optional conversation title")
    initial_message: Optional[str] = Field(None, description="Optional first message")


class MessageCreate(APIBaseModel):
    """Request to send a message"""
    content: str = Field(..., min_length=1, max_length=10000, description="Message content")


class ConversationResponse(APIBaseModel):
    """Response containing conversation details"""
    id: str
    user_id: str
    organization_id: Optional[str]
    title: str
    messages: List[Message]
    context: Dict[str, Any]
    status: str
    last_activity: datetime
    created_at: datetime
    updated_at: datetime
