"""
Traveler Routes for TravelWeaver V2
Handles traveler CRUD operations
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from app.v2.models.traveler import (
    TravelerCreate,
    TravelerUpdate,
    TravelerResponse
)
from app.v2.services.traveler_service import TravelerService
from app.v2.core.security import get_current_user, require_permissions


router = APIRouter()


@router.post("", response_model=TravelerResponse, status_code=status.HTTP_201_CREATED)
async def create_traveler(
    traveler_data: TravelerCreate,
    current_user: dict = Depends(require_permissions("travelers:write"))
):
    """
    Create a new traveler

    Requires permission: travelers:write
    """
    service = TravelerService()

    result = service.create_traveler(
        traveler_data=traveler_data.model_dump(),
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    traveler = result["data"]

    return TravelerResponse(
        id=traveler["_id"],
        name=traveler["name"],
        email=traveler["email"],
        phone=traveler["phone"],
        nationality=traveler["nationality"],
        date_of_birth=traveler.get("date_of_birth"),
        passport=traveler.get("passport"),
        preferences=traveler.get("preferences", {}),
        emergency_contact=traveler.get("emergency_contact"),
        total_bookings=traveler.get("total_bookings", 0),
        total_spent=traveler.get("total_spent", 0.0),
        created_at=traveler["created_at"],
        updated_at=traveler["updated_at"]
    )


@router.get("", response_model=dict)
async def list_travelers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: dict = Depends(require_permissions("travelers:read"))
):
    """
    List all travelers for the organization

    Requires permission: travelers:read
    """
    service = TravelerService()

    result = service.list_travelers(
        organization_id=current_user["organization_id"],
        page=page,
        per_page=per_page,
        search=search
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    return result["data"]


@router.get("/{traveler_id}", response_model=TravelerResponse)
async def get_traveler(
    traveler_id: str,
    current_user: dict = Depends(require_permissions("travelers:read"))
):
    """
    Get traveler details

    Requires permission: travelers:read
    """
    service = TravelerService()

    result = service.get_traveler(
        traveler_id=traveler_id,
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    traveler = result["data"]

    return TravelerResponse(
        id=traveler["_id"],
        name=traveler["name"],
        email=traveler["email"],
        phone=traveler["phone"],
        nationality=traveler["nationality"],
        date_of_birth=traveler.get("date_of_birth"),
        passport=traveler.get("passport"),
        preferences=traveler.get("preferences", {}),
        emergency_contact=traveler.get("emergency_contact"),
        total_bookings=traveler.get("total_bookings", 0),
        total_spent=traveler.get("total_spent", 0.0),
        created_at=traveler["created_at"],
        updated_at=traveler["updated_at"]
    )


@router.patch("/{traveler_id}", response_model=TravelerResponse)
async def update_traveler(
    traveler_id: str,
    traveler_update: TravelerUpdate,
    current_user: dict = Depends(require_permissions("travelers:write"))
):
    """
    Update traveler information

    Requires permission: travelers:write
    """
    service = TravelerService()

    # Only include non-None fields
    updates = traveler_update.model_dump(exclude_none=True)

    result = service.update_traveler(
        traveler_id=traveler_id,
        updates=updates,
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    traveler = result["data"]

    return TravelerResponse(
        id=traveler["_id"],
        name=traveler["name"],
        email=traveler["email"],
        phone=traveler["phone"],
        nationality=traveler["nationality"],
        date_of_birth=traveler.get("date_of_birth"),
        passport=traveler.get("passport"),
        preferences=traveler.get("preferences", {}),
        emergency_contact=traveler.get("emergency_contact"),
        total_bookings=traveler.get("total_bookings", 0),
        total_spent=traveler.get("total_spent", 0.0),
        created_at=traveler["created_at"],
        updated_at=traveler["updated_at"]
    )


@router.delete("/{traveler_id}", status_code=status.HTTP_200_OK)
async def delete_traveler(
    traveler_id: str,
    current_user: dict = Depends(require_permissions("travelers:write"))
):
    """
    Delete a traveler

    Requires permission: travelers:write
    """
    service = TravelerService()

    result = service.delete_traveler(
        traveler_id=traveler_id,
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    return {"success": True, "message": result["message"]}


@router.get("/health")
async def health_check():
    """Health check for travelers service"""
    return {"status": "healthy", "service": "travelers"}
