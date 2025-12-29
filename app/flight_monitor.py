"""
Flight Monitor Service for ItineraryWeaver
Background service that monitors flight status and detects changes
"""

import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app.amadeus_client import AmadeusClient
from app.database import (
    get_active_flights_for_monitoring,
    update_flight_status,
    create_flight_change,
    get_booking_by_id,
    get_traveler_by_id,
    create_notification
)
from app.notification_service import NotificationService


class FlightMonitor:
    """
    Monitors flight status and detects changes
    """
    
    def __init__(self, amadeus_client: AmadeusClient):
        self.amadeus_client = amadeus_client
        self.notification_service = NotificationService()
    
    def check_flight_status(self, flight: Dict) -> Optional[Dict]:
        """
        Check current flight status from Amadeus
        
        Args:
            flight: Flight record from database
            
        Returns:
            Updated flight status data or None if error
        """
        try:
            carrier_code = flight['carrier_code']
            flight_number = flight['flight_number']
            departure_date = flight['departure_date']
            
            # Call Amadeus Flight Status API
            response = self.amadeus_client.get_flight_status(
                carrier_code=carrier_code,
                flight_number=flight_number,
                scheduled_departure_date=departure_date
            )
            
            # Parse response
            data = response.get('data', [])
            if not data:
                return None
            
            # Get first flight segment
            flight_data = data[0]
            
            # Extract status information
            status_info = {
                'status': flight_data.get('flightStatus', {}).get('status', 'SCHEDULED'),
                'departure': {},
                'arrival': {}
            }
            
            # Parse departure info
            departure = flight_data.get('departure', {})
            if departure:
                status_info['departure'] = {
                    'airport': departure.get('iataCode'),
                    'terminal': departure.get('terminal'),
                    'gate': departure.get('gate'),
                    'scheduled_time': departure.get('scheduledTime'),
                    'estimated_time': departure.get('estimatedTime')
                }
            
            # Parse arrival info
            arrival = flight_data.get('arrival', {})
            if arrival:
                status_info['arrival'] = {
                    'airport': arrival.get('iataCode'),
                    'terminal': arrival.get('terminal'),
                    'gate': arrival.get('gate'),
                    'scheduled_time': arrival.get('scheduledTime'),
                    'estimated_time': arrival.get('estimatedTime')
                }
            
            return status_info
            
        except Exception as e:
            print(f"Error checking flight status: {e}")
            return None
    
    def detect_changes(self, stored_flight: Dict, current_status: Dict) -> List[Dict]:
        """
        Detect changes between stored flight and current status
        
        Args:
            stored_flight: Flight record from database
            current_status: Current status from Amadeus
            
        Returns:
            List of detected changes
        """
        changes = []
        
        # Check for delay
        if current_status.get('departure', {}).get('estimated_time'):
            scheduled = stored_flight.get('scheduled_departure')
            estimated = current_status['departure']['estimated_time']
            
            if scheduled and estimated:
                try:
                    scheduled_dt = datetime.fromisoformat(scheduled.replace('Z', '+00:00'))
                    estimated_dt = datetime.fromisoformat(estimated.replace('Z', '+00:00'))
                    delay_minutes = (estimated_dt - scheduled_dt).total_seconds() / 60
                    
                    if delay_minutes > 15:  # More than 15 minutes delay
                        changes.append({
                            'type': 'DELAY',
                            'previous_value': scheduled,
                            'new_value': estimated,
                            'delay_minutes': int(delay_minutes)
                        })
                except:
                    pass
        
        # Check for gate change
        stored_gate = stored_flight.get('departure_gate')
        current_gate = current_status.get('departure', {}).get('gate')
        
        if current_gate and stored_gate and current_gate != stored_gate:
            changes.append({
                'type': 'GATE_CHANGE',
                'previous_value': stored_gate,
                'new_value': current_gate
            })
        
        # Check for terminal change
        stored_terminal = stored_flight.get('departure_terminal')
        current_terminal = current_status.get('departure', {}).get('terminal')
        
        if current_terminal and stored_terminal and current_terminal != stored_terminal:
            changes.append({
                'type': 'TERMINAL_CHANGE',
                'previous_value': stored_terminal,
                'new_value': current_terminal
            })
        
        # Check for cancellation
        current_status_code = current_status.get('status', 'SCHEDULED')
        if current_status_code == 'CANCELLED':
            changes.append({
                'type': 'CANCELLED',
                'previous_value': stored_flight.get('status', 'SCHEDULED'),
                'new_value': 'CANCELLED'
            })
        
        return changes
    
    def process_flight(self, flight: Dict) -> bool:
        """
        Process a single flight: check status, detect changes, update database, send notifications
        
        Args:
            flight: Flight record from database
            
        Returns:
            True if processed successfully
        """
        try:
            # Get current status from Amadeus
            current_status = self.check_flight_status(flight)
            if not current_status:
                return False
            
            # Detect changes
            changes = self.detect_changes(flight, current_status)
            
            # Update flight status in database
            update_data = {
                'status': current_status.get('status', flight.get('status', 'SCHEDULED'))
            }
            
            if current_status.get('departure', {}).get('estimated_time'):
                update_data['estimated_departure'] = current_status['departure']['estimated_time']
            if current_status.get('arrival', {}).get('estimated_time'):
                update_data['estimated_arrival'] = current_status['arrival']['estimated_time']
            if current_status.get('departure', {}).get('gate'):
                update_data['departure_gate'] = current_status['departure']['gate']
            if current_status.get('departure', {}).get('terminal'):
                update_data['departure_terminal'] = current_status['departure']['terminal']
            
            update_flight_status(flight['id'], update_data['status'], **update_data)
            
            # Process changes
            if changes:
                booking = get_booking_by_id(flight['booking_id'])
                if booking:
                    traveler = get_traveler_by_id(booking['traveler_id'])
                    
                    for change in changes:
                        # Record change
                        create_flight_change(
                            flight_id=flight['id'],
                            change_type=change['type'],
                            previous_value=str(change.get('previous_value', '')),
                            new_value=str(change.get('new_value', ''))
                        )
                        
                        # Send notification
                        if traveler:
                            self._send_change_notification(
                                change=change,
                                flight=flight,
                                booking=booking,
                                traveler=traveler
                            )
            
            return True
            
        except Exception as e:
            print(f"Error processing flight {flight.get('id')}: {e}")
            return False
    
    def _send_change_notification(self, change: Dict, flight: Dict, 
                                 booking: Dict, traveler: Dict):
        """Send notification for a flight change"""
        try:
            change_type = change['type']
            
            # Determine notification type and template
            if change_type == 'CANCELLED':
                notification_type = 'FLIGHT_CANCELLED'
                template_name = 'flight_cancelled'
            elif change_type == 'DELAY':
                notification_type = 'FLIGHT_DELAY'
                template_name = 'flight_delay'
            elif change_type == 'GATE_CHANGE':
                notification_type = 'GATE_CHANGE'
                template_name = 'gate_change'
            else:
                notification_type = 'FLIGHT_CHANGE'
                template_name = 'flight_change'
            
            # Prepare template data
            template_data = {
                'flight_number': f"{flight['carrier_code']}{flight['flight_number']}",
                'old_value': change.get('previous_value', ''),
                'new_value': change.get('new_value', ''),
                'change_type': change_type,
                'traveler_name': f"{traveler.get('first_name', '')} {traveler.get('last_name', '')}".strip(),
                'booking_code': booking.get('booking_code', '')
            }
            
            # Create notification record
            create_notification(
                booking_id=booking['id'],
                traveler_id=traveler['id'],
                notification_type=notification_type,
                channel='whatsapp',
                recipient=traveler.get('phone', ''),
                template_name=template_name,
                template_data=template_data
            )
            
        except Exception as e:
            print(f"Error sending change notification: {e}")
    
    def run_monitoring_cycle(self):
        """
        Run one monitoring cycle: check all active flights
        """
        print(f"[{datetime.now()}] Starting flight monitoring cycle...")
        
        active_flights = get_active_flights_for_monitoring()
        print(f"Found {len(active_flights)} active flights to monitor")
        
        for flight in active_flights:
            self.process_flight(flight)
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
        print(f"[{datetime.now()}] Monitoring cycle completed")


def start_flight_monitor(amadeus_client: AmadeusClient, interval_minutes: int = 15):
    """
    Start the flight monitor service (runs in background)
    
    Args:
        amadeus_client: Amadeus client instance
        interval_minutes: How often to check flights (default 15 minutes)
    """
    monitor = FlightMonitor(amadeus_client)
    
    while True:
        try:
            monitor.run_monitoring_cycle()
        except Exception as e:
            print(f"Error in monitoring cycle: {e}")
        
        # Wait before next cycle
        time.sleep(interval_minutes * 60)

