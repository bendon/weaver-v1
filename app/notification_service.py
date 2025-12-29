"""
Notification Service for ItineraryWeaver
Handles sending notifications via WhatsApp, SMS, and Email
"""

import os
import requests
from typing import Dict, Optional
from app.database import update_notification_status, get_pending_notifications


class NotificationService:
    """
    Service for sending notifications via multiple channels
    """
    
    def __init__(self):
        self.whatsapp_api_key = os.getenv("WHATSAPP_API_KEY")
        self.whatsapp_namespace = os.getenv("WHATSAPP_NAMESPACE")
        self.whatsapp_base_url = "https://waba.360dialog.io/v1/messages"
        
        self.sms_username = os.getenv("AT_USERNAME")
        self.sms_api_key = os.getenv("AT_API_KEY")
        self.sms_sender_id = os.getenv("AT_SENDER_ID", "ItinWeaver")
        self.sms_base_url = "https://api.africastalking.com/version1/messaging"
    
    def send_whatsapp(self, recipient: str, template_name: str, 
                     template_data: Dict) -> bool:
        """
        Send WhatsApp message using 360dialog API
        
        Args:
            recipient: Phone number with country code (e.g., "+447911234567")
            template_name: WhatsApp template name
            template_data: Template parameters
            
        Returns:
            True if sent successfully
        """
        if not self.whatsapp_api_key:
            print("WhatsApp API key not configured")
            return False
        
        try:
            # Build template components
            components = []
            
            # Body parameters
            body_params = []
            for key, value in template_data.items():
                if key not in ['template_name', 'change_type']:
                    body_params.append({
                        "type": "text",
                        "text": str(value)
                    })
            
            if body_params:
                components.append({
                    "type": "body",
                    "parameters": body_params
                })
            
            payload = {
                "to": recipient,
                "type": "template",
                "template": {
                    "namespace": self.whatsapp_namespace,
                    "name": template_name,
                    "language": {"code": "en"},
                    "components": components
                }
            }
            
            headers = {
                "D360-API-KEY": self.whatsapp_api_key,
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                self.whatsapp_base_url,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"WhatsApp send failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error sending WhatsApp: {e}")
            return False
    
    def send_sms(self, recipient: str, message: str) -> bool:
        """
        Send SMS using Africa's Talking API
        
        Args:
            recipient: Phone number with country code
            message: SMS message text
            
        Returns:
            True if sent successfully
        """
        if not self.sms_api_key or not self.sms_username:
            print("SMS API credentials not configured")
            return False
        
        try:
            headers = {
                "apiKey": self.sms_api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "username": self.sms_username,
                "to": recipient,
                "message": message,
                "from": self.sms_sender_id
            }
            
            response = requests.post(
                self.sms_base_url,
                data=data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 201:
                return True
            else:
                print(f"SMS send failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Error sending SMS: {e}")
            return False
    
    def format_whatsapp_message(self, template_name: str, template_data: Dict) -> str:
        """
        Format a WhatsApp message from template data (fallback to plain text)
        
        Args:
            template_name: Template name
            template_data: Template data
            
        Returns:
            Formatted message text
        """
        if template_name == 'flight_delay':
            return (
                f"⚠️ Flight Update - {template_data.get('flight_number', '')}\n\n"
                f"Your flight has been DELAYED.\n\n"
                f"Old departure: {template_data.get('old_value', '')}\n"
                f"New departure: {template_data.get('new_value', '')}\n"
                f"Delay: {template_data.get('delay_minutes', 0)} minutes\n\n"
                f"Flight: {template_data.get('flight_number', '')}\n"
                f"View your itinerary: {template_data.get('itinerary_link', '')}"
            )
        elif template_name == 'flight_cancelled':
            return (
                f"🚨 URGENT: Flight Cancelled\n\n"
                f"{template_data.get('flight_number', '')} has been CANCELLED.\n\n"
                f"Your DMC has been notified and will contact you shortly with rebooking options.\n\n"
                f"We apologize for the inconvenience."
            )
        elif template_name == 'gate_change':
            return (
                f"🚪 Gate Change - {template_data.get('flight_number', '')}\n\n"
                f"Your gate has changed.\n\n"
                f"Flight: {template_data.get('flight_number', '')}\n"
                f"New Gate: {template_data.get('new_value', '')} (was {template_data.get('old_value', '')})\n"
                f"View itinerary: {template_data.get('itinerary_link', '')}"
            )
        elif template_name == 'itinerary_delivery':
            return (
                f"🌍 Your Trip Itinerary is Ready!\n\n"
                f"Hi {template_data.get('traveler_name', '')},\n\n"
                f"Your {template_data.get('trip_title', '')} itinerary is ready.\n\n"
                f"📅 {template_data.get('start_date', '')} - {template_data.get('end_date', '')}\n"
                f"✈️ {template_data.get('flight_count', 0)} flights\n"
                f"🏨 {template_data.get('hotel_count', 0)} hotels\n\n"
                f"View your full itinerary:\n{template_data.get('itinerary_link', '')}\n\n"
                f"Have a great trip! 🎉"
            )
        else:
            # Generic message
            return f"Flight Update: {template_data.get('flight_number', '')} - {template_data.get('change_type', '')}"
    
    def process_notification(self, notification: Dict) -> bool:
        """
        Process a single notification (send via appropriate channel)
        
        Args:
            notification: Notification record from database
            
        Returns:
            True if sent successfully
        """
        try:
            import json
            template_data = json.loads(notification.get('template_data_json', '{}'))
            template_name = notification.get('template_name', 'flight_change')
            channel = notification.get('channel', 'whatsapp')
            recipient = notification.get('recipient', '')
            
            success = False
            
            if channel == 'whatsapp':
                # Try WhatsApp first
                success = self.send_whatsapp(recipient, template_name, template_data)
                
                # Fallback to SMS if WhatsApp fails
                if not success:
                    message = self.format_whatsapp_message(template_name, template_data)
                    success = self.send_sms(recipient, message)
                    if success:
                        update_notification_status(notification['id'], 'sent')
                        return True
            elif channel == 'sms':
                message = self.format_whatsapp_message(template_name, template_data)
                success = self.send_sms(recipient, message)
            
            if success:
                update_notification_status(notification['id'], 'sent')
            else:
                update_notification_status(
                    notification['id'], 
                    'failed',
                    error_message="Failed to send notification"
                )
            
            return success
            
        except Exception as e:
            print(f"Error processing notification: {e}")
            update_notification_status(
                notification['id'],
                'failed',
                error_message=str(e)
            )
            return False
    
    def process_pending_notifications(self):
        """
        Process all pending notifications
        """
        notifications = get_pending_notifications(limit=50)
        
        for notification in notifications:
            self.process_notification(notification)
            # Small delay to avoid rate limiting
            import time
            time.sleep(0.5)

