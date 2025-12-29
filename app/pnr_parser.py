"""
PNR Text Parser for ItineraryWeaver
Parses Amadeus PNR text to extract flight and passenger information
"""

import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta


class PNRParser:
    """
    Parser for Amadeus PNR text format
    """
    
    @staticmethod
    def parse_pnr(pnr_text: str) -> Dict[str, any]:
        """
        Parse PNR text and extract structured data
        
        Args:
            pnr_text: Raw PNR text from Amadeus terminal
            
        Returns:
            Dictionary with 'travelers' and 'flights' lists
        """
        lines = [line.strip() for line in pnr_text.split('\n') if line.strip()]
        
        travelers = PNRParser._extract_travelers(lines)
        flights = PNRParser._extract_flights(lines)
        contact = PNRParser._extract_contact(lines)
        
        return {
            'travelers': travelers,
            'flights': flights,
            'contact': contact
        }
    
    @staticmethod
    def _extract_travelers(lines: List[str]) -> List[Dict]:
        """
        Extract passenger information from PNR lines
        
        Pattern: "1.SMITH/JOHN MR  2.SMITH/JANE MRS"
        """
        travelers = []
        
        for line in lines:
            # Match passenger line: "1.SMITH/JOHN MR" or "1.SMITH/JOHN MR  2.SMITH/JANE MRS"
            pattern = r'(\d+)\.([A-Z]+)\/([A-Z]+)\s+(MR|MRS|MS|MISS|MSTR|CHD|INF)'
            matches = re.finditer(pattern, line)
            
            for match in matches:
                passenger_num = match.group(1)
                last_name = match.group(2)
                first_name = match.group(3)
                title = match.group(4)
                
                travelers.append({
                    'id': f'PAX{passenger_num}',
                    'first_name': first_name.title(),
                    'last_name': last_name.title(),
                    'title': title,
                    'full_name': f"{first_name.title()} {last_name.title()}"
                })
        
        return travelers
    
    @staticmethod
    def _extract_flights(lines: List[str]) -> List[Dict]:
        """
        Extract flight information from PNR lines
        
        Pattern: "2 KQ100 Y 15JAN NBOLHR HK2 2355 0625+1"
        Format: [line_num] [carrier][flight] [class] [date] [from][to] [status] [dept] [arr]
        """
        flights = []
        current_year = datetime.now().year
        
        for line in lines:
            # Match flight line: "2 KQ100 Y 15JAN NBOLHR HK2 2355 0625+1"
            # More flexible pattern to handle variations
            pattern = r'(\d+)\s+([A-Z]{2})(\d+)\s+[A-Z]\s+(\d{2}[A-Z]{3})\s+([A-Z]{3})([A-Z]{3})\s+[A-Z]{2}\d\s+(\d{4})\s+(\d{4}[\+\-]?\d?)'
            match = re.search(pattern, line)
            
            if match:
                line_num = match.group(1)
                carrier_code = match.group(2)
                flight_number = match.group(3)
                date_str = match.group(4)  # e.g., "15JAN"
                from_airport = match.group(5)
                to_airport = match.group(6)
                dept_time = match.group(7)  # e.g., "2355"
                arr_time = match.group(8)  # e.g., "0625+1"
                
                # Parse date
                try:
                    # Convert "15JAN" to datetime
                    date_obj = datetime.strptime(f"{date_str}{current_year}", "%d%b%Y")
                    # If date is in the past, assume next year
                    if date_obj < datetime.now():
                        date_obj = datetime.strptime(f"{date_str}{current_year + 1}", "%d%b%Y")
                except:
                    continue
                
                # Parse departure time
                dept_hour = int(dept_time[:2])
                dept_min = int(dept_time[2:])
                scheduled_departure = date_obj.replace(hour=dept_hour, minute=dept_min)
                
                # Parse arrival time (handle +1 for next day)
                arr_hour = int(arr_time[:2])
                arr_min = int(arr_time[2:4])
                days_offset = 0
                if '+' in arr_time or arr_time.endswith('+1'):
                    days_offset = 1
                elif '-' in arr_time:
                    days_offset = -1
                
                scheduled_arrival = (date_obj + timedelta(days=days_offset)).replace(
                    hour=arr_hour, minute=arr_min
                )
                
                flights.append({
                    'carrier_code': carrier_code,
                    'flight_number': flight_number,
                    'departure_date': date_obj.strftime('%Y-%m-%d'),
                    'departure_airport': from_airport,
                    'arrival_airport': to_airport,
                    'scheduled_departure': scheduled_departure.isoformat(),
                    'scheduled_arrival': scheduled_arrival.isoformat(),
                    'departure_time': f"{dept_hour:02d}:{dept_min:02d}",
                    'arrival_time': f"{arr_hour:02d}:{arr_min:02d}"
                })
        
        return flights
    
    @staticmethod
    def _extract_contact(lines: List[str]) -> Optional[Dict]:
        """
        Extract contact information from PNR lines
        
        Pattern: "4 AP NBO +254 722 123 456" or "5 AP NBO 0722123456"
        """
        for line in lines:
            # Match contact line: "4 AP NBO +254 722 123 456" or "5 AP NBO 0722123456"
            pattern = r'^\d+\s+AP\s+[A-Z]{3}\s+(.+)'
            match = re.search(pattern, line)
            
            if match:
                contact_str = match.group(1).strip()
                # Extract phone number (handle various formats)
                phone_match = re.search(r'(\+?\d[\d\s]+)', contact_str)
                if phone_match:
                    phone = re.sub(r'\s+', '', phone_match.group(1))
                    return {
                        'phone': phone
                    }
        
        return None

