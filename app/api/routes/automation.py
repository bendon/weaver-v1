"""
Automation rules routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_connection
import json

router = APIRouter()


@router.get("/rules")
async def get_automation_rules(current_user: dict = Depends(get_current_user)):
    """Get all automation rules for organization"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM automation_rules 
            WHERE organization_id = ?
            ORDER BY created_at DESC
        """, (current_user['organization_id'],))
        rows = cursor.fetchall()
        conn.close()
        return {"rules": [dict(row) for row in rows], "total": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/rules/{rule_id}")
async def update_automation_rule(
    rule_id: str,
    enabled: Optional[bool] = None,
    template_override: Optional[str] = None,
    settings: Optional[dict] = None,
    current_user: dict = Depends(get_current_user)
):
    """Update automation rule"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if rule exists and belongs to organization
        cursor.execute("""
            SELECT * FROM automation_rules 
            WHERE id = ? AND organization_id = ?
        """, (rule_id, current_user['organization_id']))
        rule = cursor.fetchone()
        
        if not rule:
            conn.close()
            raise HTTPException(status_code=404, detail="Rule not found")
        
        # Build update query
        updates = []
        values = []
        
        if enabled is not None:
            updates.append("enabled = ?")
            values.append(1 if enabled else 0)
        
        if template_override is not None:
            updates.append("template_override = ?")
            values.append(template_override)
        
        if settings is not None:
            updates.append("settings = ?")
            values.append(json.dumps(settings))
        
        if not updates:
            conn.close()
            raise HTTPException(status_code=400, detail="No fields to update")
        
        values.append(rule_id)
        values.append(current_user['organization_id'])
        
        cursor.execute(f"""
            UPDATE automation_rules 
            SET {', '.join(updates)}, updated_at = datetime('now')
            WHERE id = ? AND organization_id = ?
        """, values)
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Rule updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

