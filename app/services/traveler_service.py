"""
Traveler Service - Deterministic Business Logic
Handles all traveler-related operations without AI
"""
from typing import Optional, List

from app.services.base import (
    BaseService,
    ValidationError,
    ServiceError,
    TravelerData,
    ServiceResult
)
from app.core.database import (
    create_traveler,
    get_traveler_by_id,
    get_travelers_by_organization,
    update_traveler
)


class TravelerService(BaseService):
    """
    Traveler service for managing travelers
    All operations are deterministic - no AI involved
    """

    def create(self, data: TravelerData) -> ServiceResult:
        """
        Create a new traveler

        Args:
            data: Traveler creation data

        Returns:
            ServiceResult with created traveler ID
        """
        try:
            # Validate inputs
            self._validate_traveler_data(data)

            # Create traveler in database
            traveler_id = create_traveler(
                organization_id=data['organization_id'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone=data['phone'],
                email=data.get('email')
            )

            if not traveler_id:
                return self.error("Failed to create traveler")

            return self.success(
                data={"traveler_id": traveler_id},
                message=f"Traveler {data['first_name']} {data['last_name']} created successfully"
            )

        except ValidationError as e:
            return self.error(str(e))
        except Exception as e:
            return self.error(f"Failed to create traveler: {str(e)}")

    def get(self, traveler_id: str) -> ServiceResult:
        """
        Get traveler details by ID

        Args:
            traveler_id: ID of the traveler

        Returns:
            ServiceResult with traveler details
        """
        try:
            traveler = get_traveler_by_id(traveler_id)

            if not traveler:
                return self.error("Traveler not found")

            return self.success(
                data=traveler,
                message="Traveler retrieved successfully"
            )

        except Exception as e:
            return self.error(f"Failed to get traveler: {str(e)}")

    def list_by_organization(self, organization_id: str) -> ServiceResult:
        """
        List all travelers for an organization

        Args:
            organization_id: ID of the organization

        Returns:
            ServiceResult with list of travelers
        """
        try:
            travelers = get_travelers_by_organization(organization_id)

            return self.success(
                data=travelers,
                message=f"Found {len(travelers)} travelers"
            )

        except Exception as e:
            return self.error(f"Failed to list travelers: {str(e)}")

    def update(
        self,
        traveler_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None
    ) -> ServiceResult:
        """
        Update traveler information

        Args:
            traveler_id: ID of the traveler
            first_name: New first name (optional)
            last_name: New last name (optional)
            email: New email (optional)
            phone: New phone (optional)

        Returns:
            ServiceResult
        """
        try:
            # Build update dict
            updates = {}
            if first_name:
                updates['first_name'] = first_name
            if last_name:
                updates['last_name'] = last_name
            if email is not None:
                updates['email'] = email
            if phone:
                updates['phone'] = phone

            if not updates:
                return self.error("No fields to update")

            # Update traveler
            success = update_traveler(traveler_id=traveler_id, **updates)

            if not success:
                return self.error("Failed to update traveler")

            return self.success(
                data={"traveler_id": traveler_id, "updated_fields": list(updates.keys())},
                message="Traveler updated successfully"
            )

        except Exception as e:
            return self.error(f"Failed to update traveler: {str(e)}")

    def _validate_traveler_data(self, data: TravelerData) -> None:
        """Validate traveler data"""
        # Required fields
        self.validate_required_fields(
            data,
            ['first_name', 'last_name', 'phone', 'organization_id']
        )

        # Validate email format if provided
        if data.get('email'):
            email = data['email']
            if '@' not in email or '.' not in email:
                raise ValidationError("Invalid email format")

        # Validate phone format (basic check)
        phone = data['phone']
        if len(phone) < 10:
            raise ValidationError("Phone number must be at least 10 digits")
