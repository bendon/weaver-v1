"""
Booking Service for TravelWeaver V2
Handles all booking-related business logic and orchestration
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from bson import ObjectId
import random
import string

from app.v2.services.base import BaseService, ServiceResult, ValidationError
from app.v2.core.database import get_mongo_db


class BookingService(BaseService):
    """
    Booking Service

    Responsibilities:
    - Create complete trip bookings
    - Orchestrate multiple services
    - Calculate total pricing
    - Manage booking lifecycle
    - Generate booking documents
    """

    def __init__(self):
        super().__init__()
        self.db = get_mongo_db()

    def create_booking(
        self,
        traveler_id: str,
        trip: Dict[str, Any],
        services: Dict[str, List[Dict]],
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """
        Create a complete trip booking

        Args:
            traveler_id: Traveler ID
            trip: Trip details (title, dates, destination)
            services: Services to book (flights, hotels, transport, experiences)
            organization_id: DMC organization ID
            user_id: User creating booking

        Returns:
            ServiceResult containing complete booking
        """
        try:
            # Validate required fields
            self.validate_required_fields(trip, [
                'title', 'start_date', 'end_date', 'destination'
            ])

            # Validate dates
            self.validate_date_range(trip['start_date'], trip['end_date'])

            # Verify traveler exists
            traveler = self.db.travelers.find_one({
                '_id': ObjectId(traveler_id),
                'organization_id': organization_id
            })

            if not traveler:
                return self.error('TRAVELER_NOT_FOUND', 'Traveler not found')

            # Generate booking code
            booking_code = self._generate_booking_code()

            # Calculate pricing
            pricing = self._calculate_pricing(services)

            # Create payment schedule
            payment_schedule = self._create_payment_schedule(
                pricing['total'],
                trip['start_date']
            )

            # Initialize booking document
            booking_doc = {
                'booking_code': booking_code,
                'organization_id': organization_id,
                'user_id': user_id,
                'traveler_id': traveler_id,
                'trip': trip,
                'services': services,
                'pricing': pricing,
                'payment': {
                    'status': 'pending',
                    'paid_amount': 0.0,
                    'outstanding': pricing['total'],
                    'payment_schedule': payment_schedule
                },
                'status': 'pending_payment',
                'documents': [],
                'notes': [],
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }

            # Insert booking
            result = self.db.bookings.insert_one(booking_doc)
            booking_doc['_id'] = str(result.inserted_id)

            self.log_operation('create_booking', {
                'booking_code': booking_code,
                'traveler_id': traveler_id
            }, 'success')

            return self.success(
                data=booking_doc,
                message='Booking created successfully'
            )

        except ValidationError as e:
            return self.error('VALIDATION_ERROR', str(e))
        except Exception as e:
            self.logger.error(f"Create booking failed: {str(e)}")
            return self.error('CREATE_FAILED', 'Failed to create booking')

    def get_booking(
        self,
        booking_id: str,
        organization_id: str
    ) -> ServiceResult:
        """Get booking details"""
        try:
            booking = self.db.bookings.find_one({
                '_id': ObjectId(booking_id),
                'organization_id': organization_id
            })

            if not booking:
                return self.error('NOT_FOUND', 'Booking not found')

            # Get traveler details
            traveler = self.db.travelers.find_one({
                '_id': ObjectId(booking['traveler_id'])
            })

            booking['_id'] = str(booking['_id'])
            booking['traveler_details'] = {
                'name': traveler.get('name', '') if traveler else '',
                'email': traveler.get('email', '') if traveler else '',
                'phone': traveler.get('phone', '') if traveler else ''
            }

            return self.success(data=booking)

        except Exception as e:
            self.logger.error(f"Get booking failed: {str(e)}")
            return self.error('GET_FAILED', 'Failed to retrieve booking')

    def update_booking(
        self,
        booking_id: str,
        updates: Dict[str, Any],
        organization_id: str
    ) -> ServiceResult:
        """Update booking"""
        try:
            # Recalculate pricing if services changed
            if 'services' in updates:
                pricing = self._calculate_pricing(updates['services'])
                updates['pricing'] = pricing

                # Update payment outstanding
                booking = self.db.bookings.find_one({
                    '_id': ObjectId(booking_id),
                    'organization_id': organization_id
                })

                if booking:
                    paid_amount = booking['payment']['paid_amount']
                    updates['payment.outstanding'] = pricing['total'] - paid_amount

            updates['updated_at'] = datetime.utcnow()

            result = self.db.bookings.update_one(
                {
                    '_id': ObjectId(booking_id),
                    'organization_id': organization_id
                },
                {'$set': updates}
            )

            if result.matched_count == 0:
                return self.error('NOT_FOUND', 'Booking not found')

            self.log_operation('update_booking', {'booking_id': booking_id}, 'success')

            return self.get_booking(booking_id, organization_id)

        except Exception as e:
            self.logger.error(f"Update booking failed: {str(e)}")
            return self.error('UPDATE_FAILED', 'Failed to update booking')

    def cancel_booking(
        self,
        booking_id: str,
        reason: str,
        organization_id: str,
        user_id: str
    ) -> ServiceResult:
        """Cancel booking"""
        try:
            booking = self.db.bookings.find_one({
                '_id': ObjectId(booking_id),
                'organization_id': organization_id
            })

            if not booking:
                return self.error('NOT_FOUND', 'Booking not found')

            # Calculate refund amount (simplified - 50% if > 7 days before trip)
            from datetime import datetime, timedelta
            start_date = datetime.fromisoformat(booking['trip']['start_date'])
            days_until_trip = (start_date - datetime.now()).days

            refund_percentage = 0.5 if days_until_trip > 7 else 0.0
            refund_amount = booking['payment']['paid_amount'] * refund_percentage

            cancellation_info = {
                'cancelled_at': datetime.utcnow(),
                'cancelled_by': user_id,
                'reason': reason,
                'refund_amount': refund_amount,
                'refund_status': 'pending' if refund_amount > 0 else 'none'
            }

            self.db.bookings.update_one(
                {'_id': ObjectId(booking_id)},
                {
                    '$set': {
                        'status': 'cancelled',
                        'cancellation': cancellation_info,
                        'updated_at': datetime.utcnow()
                    }
                }
            )

            self.log_operation('cancel_booking', {'booking_id': booking_id}, 'success')

            return self.success(
                data={'cancellation': cancellation_info},
                message='Booking cancelled successfully'
            )

        except Exception as e:
            self.logger.error(f"Cancel booking failed: {str(e)}")
            return self.error('CANCEL_FAILED', 'Failed to cancel booking')

    def list_bookings(
        self,
        organization_id: str,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> ServiceResult:
        """List all bookings for organization"""
        try:
            query = {'organization_id': organization_id}

            # Filter by status
            if status:
                query['status'] = status

            # Search by booking code or traveler
            if search:
                # Find travelers matching search
                traveler_ids = []
                travelers = self.db.travelers.find({
                    'organization_id': organization_id,
                    '$or': [
                        {'name': {'$regex': search, '$options': 'i'}},
                        {'email': {'$regex': search, '$options': 'i'}}
                    ]
                })
                traveler_ids = [str(t['_id']) for t in travelers]

                query['$or'] = [
                    {'booking_code': {'$regex': search, '$options': 'i'}},
                    {'traveler_id': {'$in': traveler_ids}}
                ]

            # Get total count
            total = self.db.bookings.count_documents(query)

            # Get paginated results
            skip = (page - 1) * per_page
            bookings = list(
                self.db.bookings.find(query)
                .skip(skip)
                .limit(per_page)
                .sort('created_at', -1)
            )

            # Enrich with traveler info
            for booking in bookings:
                booking['_id'] = str(booking['_id'])

                traveler = self.db.travelers.find_one({
                    '_id': ObjectId(booking['traveler_id'])
                })

                booking['traveler_summary'] = {
                    'name': traveler.get('name', '') if traveler else '',
                    'email': traveler.get('email', '') if traveler else ''
                }

            # Calculate pagination
            total_pages = (total + per_page - 1) // per_page

            return self.success(
                data={
                    'bookings': bookings,
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
            self.logger.error(f"List bookings failed: {str(e)}")
            return self.error('LIST_FAILED', 'Failed to list bookings')

    # Private helper methods

    def _generate_booking_code(self) -> str:
        """Generate unique booking code"""
        year = datetime.utcnow().year
        random_part = ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=6)
        )
        return f"TW-{year}-{random_part}"

    def _calculate_pricing(self, services: Dict[str, List[Dict]]) -> Dict[str, Any]:
        """Calculate total pricing from services"""
        service_totals = {}

        for service_type, service_list in services.items():
            total = sum(
                service.get('price', 0) for service in service_list
            )
            service_totals[service_type] = total

        subtotal = sum(service_totals.values())
        taxes = subtotal * 0.10  # 10% tax (example)
        fees = 50.00  # Booking fee (example)
        total = subtotal + taxes + fees

        return {
            'services': service_totals,
            'subtotal': subtotal,
            'taxes': taxes,
            'fees': fees,
            'discounts': 0.0,
            'total': total,
            'currency': 'USD'
        }

    def _create_payment_schedule(
        self,
        total_amount: float,
        trip_start_date: str
    ) -> List[Dict[str, Any]]:
        """Create payment schedule (30% deposit, 70% balance)"""
        from datetime import datetime, timedelta

        deposit_amount = total_amount * 0.30
        balance_amount = total_amount * 0.70

        # Deposit due immediately
        deposit_due = datetime.utcnow().strftime('%Y-%m-%d')

        # Balance due 7 days before trip
        start_date = datetime.fromisoformat(trip_start_date)
        balance_due = (start_date - timedelta(days=7)).strftime('%Y-%m-%d')

        return [
            {
                'type': 'deposit',
                'amount': deposit_amount,
                'due_date': deposit_due,
                'paid': False
            },
            {
                'type': 'balance',
                'amount': balance_amount,
                'due_date': balance_due,
                'paid': False
            }
        ]
