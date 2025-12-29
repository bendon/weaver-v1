"""
Transfer routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import (
    get_booking_by_id, create_transfer, get_transfer_by_id,
    get_transfers_by_booking, update_transfer, delete_transfer
)

router = APIRouter()


class CreateTransferRequest(BaseModel):
    scheduled_datetime: str
    from_location: str
    to_location: str
    transfer_type: Optional[str] = None
    vehicle_type: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    supplier_name: Optional[str] = None
    confirmation_number: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    notes: Optional[str] = None


class UpdateTransferRequest(BaseModel):
    scheduled_datetime: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    confirmation_number: Optional[str] = None
    price: Optional[float] = None
    notes: Optional[str] = None


@router.post("/bookings/{booking_id}/transfers")
async def add_transfer_to_booking(
    booking_id: str,
    request: CreateTransferRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a transfer to a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    transfer_id = create_transfer(
        booking_id=booking_id,
        scheduled_datetime=request.scheduled_datetime,
        from_location=request.from_location,
        to_location=request.to_location,
        transfer_type=request.transfer_type,
        vehicle_type=request.vehicle_type,
        driver_name=request.driver_name,
        driver_phone=request.driver_phone,
        supplier_name=request.supplier_name,
        confirmation_number=request.confirmation_number,
        price=request.price,
        currency=request.currency,
        notes=request.notes
    )
    
    if not transfer_id:
        raise HTTPException(status_code=500, detail="Failed to create transfer")
    
    return get_transfer_by_id(transfer_id)


@router.get("/bookings/{booking_id}/transfers")
async def get_booking_transfers(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all transfers for a booking"""
    booking = get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    transfers = get_transfers_by_booking(booking_id)
    return {"transfers": transfers, "total": len(transfers)}


@router.get("/{transfer_id}")
async def get_transfer(
    transfer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get transfer by ID"""
    transfer = get_transfer_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    booking = get_booking_by_id(transfer['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return transfer


@router.put("/{transfer_id}")
async def update_transfer_endpoint(
    transfer_id: str,
    request: UpdateTransferRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update transfer"""
    transfer = get_transfer_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    booking = get_booking_by_id(transfer['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = request.dict(exclude_unset=True)
    if update_transfer(transfer_id, **update_data):
        return get_transfer_by_id(transfer_id)
    else:
        raise HTTPException(status_code=500, detail="Failed to update transfer")


@router.delete("/{transfer_id}")
async def delete_transfer_endpoint(
    transfer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete transfer"""
    transfer = get_transfer_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    booking = get_booking_by_id(transfer['booking_id'])
    if booking['organization_id'] != current_user['organization_id']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if delete_transfer(transfer_id):
        return {"success": True, "message": "Transfer deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete transfer")

