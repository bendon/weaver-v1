"""
Webhook routes
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """WhatsApp webhook from 360dialog"""
    # TODO: Implement WhatsApp webhook handling
    data = await request.json()
    return {"status": "received", "data": data}

