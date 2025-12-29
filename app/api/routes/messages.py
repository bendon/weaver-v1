"""
Messages routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_connection

router = APIRouter()


@router.get("/")
async def get_messages(
    booking_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all messages for organization"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        if booking_id:
            cursor.execute("""
                SELECT * FROM messages 
                WHERE organization_id = ? AND booking_id = ?
                ORDER BY created_at DESC
            """, (current_user['organization_id'], booking_id))
        else:
            cursor.execute("""
                SELECT * FROM messages 
                WHERE organization_id = ?
                ORDER BY created_at DESC
            """, (current_user['organization_id'],))
        
        rows = cursor.fetchall()
        conn.close()
        return {"messages": [dict(row) for row in rows], "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

