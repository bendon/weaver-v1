"""
Booking Service - Deterministic Business Logic
Handles all booking-related operations without AI
"""
from typing import Optional, Dict, Any
import secrets
import string

from app.services.base import (
    BaseService,
    ValidationError,
    ServiceError,
    BookingCreateData,
    ServiceResult
)
from app.core.database import (
    create_booking,
    get_booking_by_id,
    update_booking,
    link_traveler_to_booking
)


class BookingService(BaseService):
    """
    Booking service for managing travel bookings
    All operations are deterministic - no AI involved
    """

    def create(self, data: BookingCreateData) -> ServiceResult:
        """
        Create a new booking with deterministic business logic

        Args:
            data: Booking creation data

        Returns:
            ServiceResult with created booking
        """
        try:
            # Validate inputs
            self._validate_create_data(data)

            # Generate booking code (deterministic algorithm)
            booking_code = self._generate_booking_code()

            # Create booking in database
            booking_id = create_booking(
                organization_id=data['organization_id'],
                created_by=data['created_by'],
                title=data['title'],
                start_date=data['start_date'],
                end_date=data['end_date'],
                total_travelers=data.get('total_travelers', 1),
                notes=data.get('notes')
            )

            if not booking_id:
                return self.error("Failed to create booking")

            # Get the created booking
            booking = get_booking_by_id(booking_id)

            return self.success(
                data={
                    "booking_id": booking_id,
                    "booking_code": booking.get("booking_code"),
                    "booking": booking
                },
                message=f"Booking '{data['title']}' created successfully"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Booking creation failed: {str(e)}")

    def get(self, booking_id: str) -> ServiceResult:
        """
        Get booking details by ID

        Args:
            booking_id: ID of the booking

        Returns:
            ServiceResult with booking details
        """
        try:
            booking = get_booking_by_id(booking_id)

            if not booking:
                return self.error("Booking not found")

            return self.success(
                data=booking,
                message="Booking retrieved successfully"
            )

        except Exception as e:
            return self.error(f"Failed to get booking: {str(e)}")

    def update_status(self, booking_id: str, status: str) -> ServiceResult:
        """
        Update booking status

        Args:
            booking_id: ID of the booking
            status: New status (draft, confirmed, in_progress, completed, cancelled)

        Returns:
            ServiceResult
        """
        try:
            # Validate status
            valid_statuses = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled']
            if status not in valid_statuses:
                raise ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

            # Update booking
            success = update_booking(booking_id=booking_id, status=status)

            if not success:
                return self.error("Failed to update booking status")

            return self.success(
                data={"booking_id": booking_id, "status": status},
                message=f"Booking status updated to '{status}'"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Failed to update status: {str(e)}")

    def update_details(
        self,
        booking_id: str,
        title: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        notes: Optional[str] = None
    ) -> ServiceResult:
        """
        Update booking details

        Args:
            booking_id: ID of the booking
            title: New title (optional)
            start_date: New start date (optional)
            end_date: New end date (optional)
            notes: New notes (optional)

        Returns:
            ServiceResult
        """
        try:
            # Build update dict
            updates = {}
            if title:
                updates['title'] = title
            if start_date:
                self.validate_date(start_date, 'Start date')
                updates['start_date'] = start_date
            if end_date:
                self.validate_date(end_date, 'End date')
                updates['end_date'] = end_date
            if notes is not None:
                updates['notes'] = notes

            if not updates:
                return self.error("No fields to update")

            # Validate date range if both provided
            if 'start_date' in updates and 'end_date' in updates:
                self.validate_date_range(updates['start_date'], updates['end_date'])

            # Update booking
            success = update_booking(booking_id=booking_id, **updates)

            if not success:
                return self.error("Failed to update booking")

            return self.success(
                data={"booking_id": booking_id, "updated_fields": list(updates.keys())},
                message="Booking updated successfully"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Failed to update booking: {str(e)}")

    def add_traveler(
        self,
        booking_id: str,
        traveler_id: str,
        is_primary: bool = False
    ) -> ServiceResult:
        """
        Link a traveler to a booking

        Args:
            booking_id: ID of the booking
            traveler_id: ID of the traveler
            is_primary: Whether this is the primary traveler

        Returns:
            ServiceResult
        """
        try:
            # Link traveler to booking
            link_traveler_to_booking(
                booking_id=booking_id,
                traveler_id=traveler_id,
                is_primary=is_primary
            )

            return self.success(
                data={"booking_id": booking_id, "traveler_id": traveler_id},
                message="Traveler added to booking successfully"
            )

        except Exception as e:
            return self.error(f"Failed to add traveler: {str(e)}")

    def _validate_create_data(self, data: BookingCreateData) -> None:
        """Validate booking creation data"""
        # Required fields
        self.validate_required_fields(
            data,
            ['title', 'start_date', 'end_date', 'organization_id', 'created_by']
        )

        # Validate dates
        self.validate_date(data['start_date'], 'Start date')
        self.validate_date(data['end_date'], 'End date')
        self.validate_date_range(data['start_date'], data['end_date'])

        # Validate total travelers
        if data.get('total_travelers') and data['total_travelers'] < 1:
            raise ValidationError("Total travelers must be at least 1")

    def _generate_booking_code(self) -> str:
        """
        Generate a unique booking code
        Deterministic algorithm: 6 uppercase letters + 4 digits
        """
        letters = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(6))
        digits = ''.join(secrets.choice(string.digits) for _ in range(4))
        return f"{letters}{digits}"
