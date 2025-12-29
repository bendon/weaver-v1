"""
Itinerary Compiler and Formatter for ItineraryWeaver PoC
"""

import hashlib
import json
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any
from collections import defaultdict
from enum import Enum

from app.models import (
    Itinerary, ItineraryDay, ItineraryBranding,
    Traveler, FlightBooking, HotelReservation, Transfer, Activity
)


class ItineraryCompiler:
    """
    Compiles travel components into a structured itinerary
    """
    
    def __init__(self, branding: ItineraryBranding = None):
        """
        Initialize compiler
        
        Args:
            branding: Branding configuration for the itinerary
        """
        self.branding = branding or ItineraryBranding(
            company_name="Travel Agency",
            primary_color="#1E88E5"
        )
    
    def compile(
        self,
        reference_number: str,
        title: str,
        description: str = None,
        travelers: List[Traveler] = None,
        flights: List[FlightBooking] = None,
        hotels: List[HotelReservation] = None,
        transfers: List[Transfer] = None,
        activities: List[Activity] = None
    ) -> Itinerary:
        """
        Compile all travel components into a structured itinerary
        
        Args:
            reference_number: Booking reference number
            title: Itinerary title
            description: Itinerary description
            travelers: List of travelers
            flights: List of flight bookings
            hotels: List of hotel reservations
            transfers: List of transfers
            activities: List of activities
        
        Returns:
            Compiled Itinerary object
        """
        travelers = travelers or []
        flights = flights or []
        hotels = hotels or []
        transfers = transfers or []
        activities = activities or []
        
        # Generate itinerary ID
        itinerary_id = f"ITIN-{reference_number}"
        
        # Calculate duration
        all_dates = []
        for hotel in hotels:
            all_dates.extend([hotel.check_in_date, hotel.check_out_date])
        for activity in activities:
            if activity.activity_date:
                all_dates.append(activity.activity_date)
        for transfer in transfers:
            if transfer.pickup_datetime:
                all_dates.append(transfer.pickup_datetime.date())
        
        if all_dates:
            start_date = min(d for d in all_dates if d)
            end_date = max(d for d in all_dates if d)
            duration_nights = (end_date - start_date).days
        else:
            duration_nights = 0
        
        # Organize by day
        days = self._organize_by_day(
            hotels=hotels,
            transfers=transfers,
            activities=activities,
            flights=flights
        )
        
        # Generate change hash
        change_hash = self._generate_hash(
            flights, hotels, transfers, activities
        )
        
        itinerary = Itinerary(
            itinerary_id=itinerary_id,
            reference_number=reference_number,
            title=title,
            description=description,
            travelers=travelers,
            flights=flights,
            hotels=hotels,
            transfers=transfers,
            activities=activities,
            days=days,
            branding=self.branding,
            duration_nights=duration_nights,
            last_change_hash=change_hash
        )
        
        return itinerary
    
    def _organize_by_day(
        self,
        hotels: List[HotelReservation],
        transfers: List[Transfer],
        activities: List[Activity],
        flights: List[FlightBooking]
    ) -> List[ItineraryDay]:
        """
        Organize components by day
        """
        days_dict = defaultdict(lambda: {
            "activities": [],
            "transfers": [],
            "location": None
        })
        
        # Add hotels to determine location per day
        for hotel in hotels:
            current_date = hotel.check_in_date
            while current_date < hotel.check_out_date:
                days_dict[current_date]["location"] = hotel.hotel.city or hotel.hotel.country
                current_date += timedelta(days=1)
        
        # Add activities
        for activity in activities:
            if activity.activity_date:
                days_dict[activity.activity_date]["activities"].append(activity)
                if not days_dict[activity.activity_date]["location"]:
                    days_dict[activity.activity_date]["location"] = activity.location or "Unknown"
        
        # Add transfers
        for transfer in transfers:
            if transfer.pickup_datetime:
                transfer_date = transfer.pickup_datetime.date()
                days_dict[transfer_date]["transfers"].append(transfer)
        
        # Convert to ItineraryDay objects
        sorted_dates = sorted(days_dict.keys())
        days = []
        
        for idx, day_date in enumerate(sorted_dates, 1):
            day_data = days_dict[day_date]
            days.append(ItineraryDay(
                date=day_date,
                day_number=idx,
                location=day_data["location"] or "Travel Day",
                activities=sorted(day_data["activities"], key=lambda a: a.start_time or time(0, 0)),
                transfers=day_data["transfers"]
            ))
        
        return days
    
    def _generate_hash(
        self,
        flights: List[FlightBooking],
        hotels: List[HotelReservation],
        transfers: List[Transfer],
        activities: List[Activity]
    ) -> str:
        """
        Generate hash of itinerary contents for change detection
        """
        data = {
            "flights": [f.booking_id for f in flights],
            "hotels": [h.booking_id for h in hotels],
            "transfers": [t.booking_id for t in transfers],
            "activities": [a.booking_id for a in activities]
        }
        
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()


class ItineraryFormatter:
    """
    Formats itineraries into various output formats
    """
    
    @staticmethod
    def to_whatsapp_message(itinerary: Itinerary) -> str:
        """
        Format itinerary as WhatsApp message
        """
        lines = []
        
        # Header
        lines.append(f"*{itinerary.title}*")
        lines.append(f"Reference: {itinerary.reference_number}")
        lines.append("")
        
        if itinerary.description:
            lines.append(itinerary.description)
            lines.append("")
        
        # Travelers
        if itinerary.travelers:
            lines.append("*Travelers:*")
            for traveler in itinerary.travelers:
                lines.append(f"• {traveler.first_name} {traveler.last_name}")
            lines.append("")
        
        # Flights
        if itinerary.flights:
            lines.append("*✈️ FLIGHTS*")
            lines.append("")
            for flight in itinerary.flights:
                for segment in flight.segments:
                    dep = segment.departure_airport
                    arr = segment.arrival_airport
                    dep_time = segment.departure_datetime.strftime("%d %b %Y, %H:%M")
                    arr_time = segment.arrival_datetime.strftime("%d %b %Y, %H:%M")
                    
                    lines.append(f"*{segment.carrier_name} {segment.carrier_code}{segment.flight_number}*")
                    lines.append(f"{dep_time} {dep.iata_code} → {arr_time} {arr.iata_code}")
                    lines.append(f"{dep.city} → {arr.city}")
                    lines.append(f"Class: {segment.cabin_class}")
                    lines.append("")
            lines.append("")
        
        # Hotels
        if itinerary.hotels:
            lines.append("*🏨 ACCOMMODATION*")
            lines.append("")
            for hotel in itinerary.hotels:
                lines.append(f"*{hotel.hotel.name}*")
                lines.append(f"{hotel.check_in_date.strftime('%d %b %Y')} - {hotel.check_out_date.strftime('%d %b %Y')}")
                lines.append(f"Room: {hotel.room_type}")
                if hotel.meal_plan:
                    lines.append(f"Meal Plan: {hotel.meal_plan}")
                lines.append(f"Confirmation: {hotel.confirmation_number}")
                lines.append("")
            lines.append("")
        
        # Daily itinerary
        if itinerary.days:
            lines.append("*📅 DAILY ITINERARY*")
            lines.append("")
            for day in itinerary.days:
                lines.append(f"*Day {day.day_number} - {day.date.strftime('%d %b %Y')}*")
                lines.append(f"📍 {day.location}")
                lines.append("")
                
                # Transfers
                for transfer in day.transfers:
                    if transfer.pickup_datetime:
                        time_str = transfer.pickup_datetime.strftime("%H:%M")
                        lines.append(f"🚗 {time_str} Transfer: {transfer.pickup_location} → {transfer.dropoff_location}")
                
                # Activities
                for activity in day.activities:
                    time_str = ""
                    if activity.start_time:
                        time_str = f"{activity.start_time.strftime('%H:%M')} "
                    lines.append(f"🎯 {time_str}{activity.name}")
                    if activity.description:
                        lines.append(f"   {activity.description}")
                    if activity.meeting_point:
                        lines.append(f"   Meeting: {activity.meeting_point}")
                
                lines.append("")
        
        # Footer
        if itinerary.branding:
            lines.append("")
            lines.append("─" * 30)
            if itinerary.branding.company_name:
                lines.append(f"*{itinerary.branding.company_name}*")
            if itinerary.branding.contact_whatsapp:
                lines.append(f"📱 {itinerary.branding.contact_whatsapp}")
            if itinerary.branding.contact_email:
                lines.append(f"✉️ {itinerary.branding.contact_email}")
        
        return "\n".join(lines)
    
    @staticmethod
    def to_html(itinerary: Itinerary) -> str:
        """
        Format itinerary as HTML document
        """
        primary_color = itinerary.branding.primary_color if itinerary.branding else "#1E88E5"
        secondary_color = itinerary.branding.secondary_color if itinerary.branding else "#FFFFFF"
        company_name = itinerary.branding.company_name if itinerary.branding else "Travel Agency"
        
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{itinerary.title} - {itinerary.reference_number}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            background: {primary_color};
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 28px;
            margin-bottom: 10px;
        }}
        .header .ref {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .content {{
            padding: 30px;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section h2 {{
            color: {primary_color};
            font-size: 22px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid {primary_color};
        }}
        .flight-card, .hotel-card, .activity-card, .transfer-card {{
            background: #f9f9f9;
            border-left: 4px solid {primary_color};
            padding: 20px;
            margin-bottom: 15px;
            border-radius: 4px;
        }}
        .day-card {{
            background: #f9f9f9;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 4px;
        }}
        .day-header {{
            font-size: 18px;
            font-weight: bold;
            color: {primary_color};
            margin-bottom: 15px;
        }}
        .footer {{
            background: #333;
            color: white;
            padding: 30px;
            text-align: center;
        }}
        .footer a {{
            color: white;
            text-decoration: none;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background: {primary_color};
            color: white;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{itinerary.title}</h1>
            <div class="ref">Reference: {itinerary.reference_number}</div>
        </div>
        
        <div class="content">
"""
        
        if itinerary.description:
            html += f'<div class="section"><p style="font-size: 16px; color: #666;">{itinerary.description}</p></div>'
        
        # Travelers
        if itinerary.travelers:
            html += '<div class="section"><h2>Travelers</h2><ul>'
            for traveler in itinerary.travelers:
                html += f'<li>{traveler.first_name} {traveler.last_name}</li>'
            html += '</ul></div>'
        
        # Flights
        if itinerary.flights:
            html += '<div class="section"><h2>✈️ Flights</h2>'
            for flight in itinerary.flights:
                for segment in flight.segments:
                    dep = segment.departure_airport
                    arr = segment.arrival_airport
                    dep_time = segment.departure_datetime.strftime("%d %b %Y, %H:%M")
                    arr_time = segment.arrival_datetime.strftime("%d %b %Y, %H:%M")
                    
                    html += f'''
                    <div class="flight-card">
                        <strong>{segment.carrier_name} {segment.carrier_code}{segment.flight_number}</strong><br>
                        {dep_time} {dep.iata_code} → {arr_time} {arr.iata_code}<br>
                        {dep.city} → {arr.city}<br>
                        Class: {segment.cabin_class}
                    </div>
                    '''
            html += '</div>'
        
        # Hotels
        if itinerary.hotels:
            html += '<div class="section"><h2>🏨 Accommodation</h2>'
            for hotel in itinerary.hotels:
                html += f'''
                <div class="hotel-card">
                    <strong>{hotel.hotel.name}</strong><br>
                    {hotel.check_in_date.strftime('%d %b %Y')} - {hotel.check_out_date.strftime('%d %b %Y')}<br>
                    Room: {hotel.room_type}<br>
                    {f'Meal Plan: {hotel.meal_plan}<br>' if hotel.meal_plan else ''}
                    Confirmation: {hotel.confirmation_number}
                </div>
                '''
            html += '</div>'
        
        # Daily itinerary
        if itinerary.days:
            html += '<div class="section"><h2>📅 Daily Itinerary</h2>'
            for day in itinerary.days:
                html += f'''
                <div class="day-card">
                    <div class="day-header">Day {day.day_number} - {day.date.strftime('%d %b %Y')} - {day.location}</div>
                '''
                
                # Transfers
                for transfer in day.transfers:
                    if transfer.pickup_datetime:
                        time_str = transfer.pickup_datetime.strftime("%H:%M")
                        html += f'<div class="transfer-card">🚗 {time_str} Transfer: {transfer.pickup_location} → {transfer.dropoff_location}</div>'
                
                # Activities
                for activity in day.activities:
                    time_str = ""
                    if activity.start_time:
                        time_str = f"{activity.start_time.strftime('%H:%M')} "
                    html += f'<div class="activity-card">'
                    html += f'<strong>🎯 {time_str}{activity.name}</strong>'
                    if activity.description:
                        html += f'<br>{activity.description}'
                    if activity.meeting_point:
                        html += f'<br><small>Meeting: {activity.meeting_point}</small>'
                    html += '</div>'
                
                html += '</div>'
            html += '</div>'
        
        html += '''
        </div>
        
        <div class="footer">
'''
        
        if itinerary.branding:
            html += f'<p><strong>{company_name}</strong></p>'
            if itinerary.branding.contact_phone:
                html += f'<p>📞 {itinerary.branding.contact_phone}</p>'
            if itinerary.branding.contact_email:
                html += f'<p>✉️ <a href="mailto:{itinerary.branding.contact_email}">{itinerary.branding.contact_email}</a></p>'
            if itinerary.branding.website:
                html += f'<p>🌐 <a href="https://{itinerary.branding.website}">{itinerary.branding.website}</a></p>'
            if itinerary.branding.footer_text:
                html += f'<p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">{itinerary.branding.footer_text}</p>'
        
        html += '''
        </div>
    </div>
</body>
</html>
'''
        
        return html
    
    @staticmethod
    def to_json(itinerary: Itinerary) -> Dict[str, Any]:
        """
        Convert itinerary to JSON-serializable dictionary
        """
        def serialize(obj, visited=None):
            if visited is None:
                visited = set()
            
            # Handle primitive types
            if obj is None:
                return None
            if isinstance(obj, (str, int, float, bool)):
                return obj
            if isinstance(obj, (datetime, date, time)):
                return obj.isoformat()
            if isinstance(obj, Enum):
                return obj.value
            
            # Prevent circular references
            obj_id = id(obj)
            if obj_id in visited:
                return "<circular reference>"
            visited.add(obj_id)
            
            try:
                if isinstance(obj, list):
                    return [serialize(item, visited) for item in obj]
                elif isinstance(obj, dict):
                    return {k: serialize(v, visited) for k, v in obj.items()}
                elif hasattr(obj, '__dict__'):
                    return {k: serialize(v, visited) for k, v in obj.__dict__.items() if not k.startswith('_')}
                else:
                    return str(obj)
            finally:
                visited.discard(obj_id)
        
        return serialize(itinerary)

