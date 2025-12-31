"""
Booking Routes for TravelWeaver V2
Handles booking CRUD operations
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional

from app.v2.models.booking import (
    BookingCreateRequest,
    BookingResponse,
    BookingStatus
)
from app.v2.services.booking_service import BookingService
from app.v2.core.security import get_current_user, require_permissions


router = APIRouter()


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreateRequest,
    current_user: dict = Depends(require_permissions("bookings:write"))
):
    """
    Create a new booking

    Requires permission: bookings:write
    """
    service = BookingService()

    result = service.create_booking(
        traveler_id=booking_data.traveler_id,
        trip=booking_data.trip.model_dump(),
        services=booking_data.services,
        organization_id=current_user["organization_id"],
        user_id=current_user["id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )

    booking = result["data"]

    return BookingResponse(
        id=booking["_id"],
        booking_code=booking["booking_code"],
        status=BookingStatus(booking["status"]),
        traveler=booking.get("traveler_details", {}),
        trip=booking["trip"],
        services=booking["services"],
        pricing=booking["pricing"],
        payment=booking["payment"],
        created_at=booking["created_at"],
        updated_at=booking["updated_at"]
    )


@router.get("", response_model=dict)
async def list_bookings(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_permissions("bookings:read"))
):
    """
    List all bookings for the organization

    Requires permission: bookings:read
    """
    service = BookingService()

    result = service.list_bookings(
        organization_id=current_user["organization_id"],
        page=page,
        per_page=per_page,
        status=status,
        search=search
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    return result["data"]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(require_permissions("bookings:read"))
):
    """
    Get booking details

    Requires permission: bookings:read
    """
    service = BookingService()

    result = service.get_booking(
        booking_id=booking_id,
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    booking = result["data"]

    return BookingResponse(
        id=booking["_id"],
        booking_code=booking["booking_code"],
        status=BookingStatus(booking["status"]),
        traveler=booking.get("traveler_details", {}),
        trip=booking["trip"],
        services=booking["services"],
        pricing=booking["pricing"],
        payment=booking["payment"],
        created_at=booking["created_at"],
        updated_at=booking["updated_at"]
    )


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    updates: dict,
    current_user: dict = Depends(require_permissions("bookings:write"))
):
    """
    Update booking information

    Requires permission: bookings:write
    """
    service = BookingService()

    result = service.update_booking(
        booking_id=booking_id,
        updates=updates,
        organization_id=current_user["organization_id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    booking = result["data"]

    return BookingResponse(
        id=booking["_id"],
        booking_code=booking["booking_code"],
        status=BookingStatus(booking["status"]),
        traveler=booking.get("traveler_details", {}),
        trip=booking["trip"],
        services=booking["services"],
        pricing=booking["pricing"],
        payment=booking["payment"],
        created_at=booking["created_at"],
        updated_at=booking["updated_at"]
    )


@router.post("/{booking_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_booking(
    booking_id: str,
    cancellation_data: dict,
    current_user: dict = Depends(require_permissions("bookings:write"))
):
    """
    Cancel a booking

    Requires permission: bookings:write
    """
    service = BookingService()

    result = service.cancel_booking(
        booking_id=booking_id,
        reason=cancellation_data.get("reason", "User requested cancellation"),
        organization_id=current_user["organization_id"],
        user_id=current_user["id"]
    )

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND if result["error"] == "NOT_FOUND" else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["message"]
        )

    return {
        "success": True,
        "message": result["message"],
        "data": result["data"]
    }


@router.get("/health")
async def health_check():
    """Health check for bookings service"""
    return {"status": "healthy", "service": "bookings"}
