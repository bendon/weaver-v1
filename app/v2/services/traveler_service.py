"""
Traveler Service for TravelWeaver V2
Handles all traveler-related business logic
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from bson import ObjectId

from app.v2.services.base import BaseService, ServiceResult, ValidationError
from app.v2.core.database import get_mongo_db


class TravelerService(BaseService):
    """
    Traveler Service

    Responsibilities:
    - Create traveler profiles
    - Update traveler information
    - Manage passport details
    - Track travel history
    - Manage preferences
    """

    def __init__(self):
        super().__init__()
        self.db = get_mongo_db()

    def create_traveler(
        self,
        traveler_data: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """
        Create a new traveler profile

        Args:
            traveler_data: Traveler information
            organization_id: DMC organization ID

        Returns:
            ServiceResult containing created traveler
        """
        try:
            # Validate required fields
            self.validate_required_fields(traveler_data, [
                'name', 'email', 'phone', 'nationality'
            ])

            # Check for duplicate email within organization
            existing = self.db.travelers.find_one({
                'email': traveler_data['email'],
                'organization_id': organization_id
            })

            if existing:
                return self.error(
                    'DUPLICATE_EMAIL',
                    'Traveler with this email already exists in your organization'
                )

            # Create traveler document
            traveler_doc = {
                **traveler_data,
                'organization_id': organization_id,
                'travel_history': [],
                'total_bookings': 0,
                'total_spent': 0.0,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            # Insert into database
            result = self.db.travelers.insert_one(traveler_doc)
            traveler_doc['_id'] = str(result.inserted_id)

            self.log_operation('create_traveler', {'email': traveler_data['email']}, 'success')

            return self.success(
                data=traveler_doc,
                message='Traveler created successfully'
            )

        except ValidationError as e:
            return self.error('VALIDATION_ERROR', str(e))
        except Exception as e:
            self.logger.error(f"Create traveler failed: {str(e)}")
            return self.error('CREATE_FAILED', 'Failed to create traveler')

    def get_traveler(
        self,
        traveler_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Get traveler details"""
        try:
            traveler = self.db.travelers.find_one({
                '_id': ObjectId(traveler_id),
                'organization_id': organization_id
            })

            if not traveler:
                return self.error('NOT_FOUND', 'Traveler not found')

            traveler['_id'] = str(traveler['_id'])

            return self.success(data=traveler)

        except Exception as e:
            self.logger.error(f"Get traveler failed: {str(e)}")
            return self.error('GET_FAILED', 'Failed to retrieve traveler')

    def update_traveler(
        self,
        traveler_id: str,
        updates: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """Update traveler information"""
        try:
            updates['updated_at'] = datetime.utcnow()

            result = self.db.travelers.update_one(
                {
                    '_id': ObjectId(traveler_id),
                    'organization_id': organization_id
                },
                {'$set': updates}
            )

            if result.matched_count == 0:
                return self.error('NOT_FOUND', 'Traveler not found')

            self.log_operation('update_traveler', {'traveler_id': traveler_id}, 'success')

            return self.get_traveler(traveler_id, organization_id)

        except Exception as e:
            self.logger.error(f"Update traveler failed: {str(e)}")
            return self.error('UPDATE_FAILED', 'Failed to update traveler')

    def delete_traveler(
        self,
        traveler_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Delete traveler"""
        try:
            result = self.db.travelers.delete_one({
                '_id': ObjectId(traveler_id),
                'organization_id': organization_id
            })

            if result.deleted_count == 0:
                return self.error('NOT_FOUND', 'Traveler not found')

            self.log_operation('delete_traveler', {'traveler_id': traveler_id}, 'success')

            return self.success(message='Traveler deleted successfully')

        except Exception as e:
            self.logger.error(f"Delete traveler failed: {str(e)}")
            return self.error('DELETE_FAILED', 'Failed to delete traveler')

    def list_travelers(
        self,
        organization_id: str,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None
    ) -> ServiceResult:
        """List all travelers for organization"""
        try:
            query = {'organization_id': organization_id}

            # Add search filter
            if search:
                query['$or'] = [
                    {'name': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}}
                ]

            # Get total count
            total = self.db.travelers.count_documents(query)

            # Get paginated results
            skip = (page - 1) * per_page
            travelers = list(
                self.db.travelers.find(query)
                .skip(skip)
                .limit(per_page)
                .sort('created_at', -1)
            )

            # Convert ObjectIds
            for traveler in travelers:
                traveler['_id'] = str(traveler['_id'])

            # Calculate pagination
            total_pages = (total + per_page - 1) // per_page

            return self.success(
                data={
                    'travelers': travelers,
                    'pagination': {
                        'current_page': page,
                        'per_page': per_page,
                        'total_items': total,
                        'total_pages': total_pages,
                        'has_next': page < total_pages,
                        'has_prev': page > 1
                    }
                }
            )

        except Exception as e:
            self.logger.error(f"List travelers failed: {str(e)}")
            return self.error('LIST_FAILED', 'Failed to list travelers')

    def add_travel_history(
        self,
        traveler_id: str,
        organization_id: str,
        booking_info: Dict[str, Any]
    ) -> ServiceResult:
        """Add travel history entry"""
        try:
            history_entry = {
                'booking_id': booking_info['booking_id'],
                'booking_code': booking_info['booking_code'],
                'destination': booking_info['destination'],
                'trip_date': booking_info['trip_date'],
                'amount_spent': booking_info['amount_spent']
            }

            result = self.db.travelers.update_one(
                {
                    '_id': ObjectId(traveler_id),
                    'organization_id': organization_id
                },
                {
                    '$push': {'travel_history': history_entry},
                    '$inc': {
                        'total_bookings': 1,
                        'total_spent': booking_info['amount_spent']
                    },
                    '$set': {'updated_at': datetime.utcnow()}
                }
            )

            if result.matched_count == 0:
                return self.error('NOT_FOUND', 'Traveler not found')

            return self.success(message='Travel history updated')

        except Exception as e:
            self.logger.error(f"Add travel history failed: {str(e)}")
            return self.error('UPDATE_FAILED', 'Failed to update travel history')
