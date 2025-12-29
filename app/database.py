"""
SQLite database module for ItineraryWeaver
"""

import sqlite3
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
import os

# Database file path
DB_PATH = Path(__file__).parent.parent / "data" / "itineraries.db"


def get_db_path() -> Path:
    """Get database file path, creating directory if needed"""
    db_path = DB_PATH
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


def init_database():
    """
    Initialize the database with required tables
    """
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Organizations (DMCs)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            logo_url TEXT,
            contact_phone TEXT,
            contact_email TEXT,
            whatsapp_number TEXT,
            settings_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Users (DMC Staff)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'agent',
            is_active INTEGER DEFAULT 1,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )
    """)
    
    # Travelers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS travelers (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            phone TEXT NOT NULL,
            phone_country_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organizations(id)
        )
    """)
    
    # Bookings
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            organization_id TEXT,
            created_by TEXT,
            traveler_id TEXT,
            booking_code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            notes TEXT,
            metadata_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (organization_id) REFERENCES organizations(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (traveler_id) REFERENCES travelers(id)
        )
    """)
    
    # Flights
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flights (
            id TEXT PRIMARY KEY,
            booking_id TEXT,
            carrier_code TEXT NOT NULL,
            flight_number TEXT NOT NULL,
            departure_date DATE NOT NULL,
            departure_airport TEXT NOT NULL,
            arrival_airport TEXT NOT NULL,
            scheduled_departure TIMESTAMP NOT NULL,
            scheduled_arrival TIMESTAMP NOT NULL,
            estimated_departure TIMESTAMP,
            estimated_arrival TIMESTAMP,
            departure_terminal TEXT,
            arrival_terminal TEXT,
            departure_gate TEXT,
            arrival_gate TEXT,
            status TEXT DEFAULT 'SCHEDULED',
            aircraft_code TEXT,
            airline_name TEXT,
            checkin_url TEXT,
            last_status_check TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
    """)
    
    # Hotels
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hotels (
            id TEXT PRIMARY KEY,
            booking_id TEXT,
            hotel_name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            country TEXT,
            phone TEXT,
            email TEXT,
            confirmation_number TEXT,
            check_in_date DATE NOT NULL,
            check_in_time TIME DEFAULT '14:00',
            check_out_date DATE NOT NULL,
            check_out_time TIME DEFAULT '11:00',
            room_type TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
    """)
    
    # Transfers
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transfers (
            id TEXT PRIMARY KEY,
            booking_id TEXT,
            transfer_type TEXT,
            datetime TIMESTAMP NOT NULL,
            from_location TEXT NOT NULL,
            to_location TEXT NOT NULL,
            vehicle_type TEXT,
            driver_name TEXT,
            driver_phone TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
    """)
    
    # Activities
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            booking_id TEXT,
            activity_name TEXT NOT NULL,
            datetime TIMESTAMP NOT NULL,
            duration_minutes INTEGER,
            location TEXT,
            description TEXT,
            confirmation_number TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
    """)
    
    # Flight Status Changes (audit log)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flight_changes (
            id TEXT PRIMARY KEY,
            flight_id TEXT,
            change_type TEXT NOT NULL,
            previous_value TEXT,
            new_value TEXT,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
        )
    """)
    
    # Notifications
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            booking_id TEXT,
            traveler_id TEXT,
            notification_type TEXT NOT NULL,
            channel TEXT NOT NULL,
            recipient TEXT NOT NULL,
            template_name TEXT,
            template_data_json TEXT,
            status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP,
            delivered_at TIMESTAMP,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (traveler_id) REFERENCES travelers(id)
        )
    """)
    
    # Airports (cache from Amadeus)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airports (
            iata_code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT,
            country TEXT,
            timezone TEXT,
            latitude REAL,
            longitude REAL,
            cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Airlines (cache from Amadeus)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airlines (
            iata_code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Keep existing itineraries table for backward compatibility
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS itineraries (
            itinerary_id TEXT PRIMARY KEY,
            reference_number TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            data_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Keep existing amadeus_bookings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS amadeus_bookings (
            booking_id TEXT PRIMARY KEY,
            amadeus_order_id TEXT UNIQUE NOT NULL,
            pnr TEXT,
            itinerary_id TEXT,
            flight_booking_id TEXT,
            booking_data_json TEXT,
            status TEXT DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_org ON bookings(organization_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_booking ON flights(booking_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights(departure_date, scheduled_departure)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_carrier ON flights(carrier_code, flight_number)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications(booking_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flight_changes_flight ON flight_changes(flight_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_flight_changes_detected ON flight_changes(detected_at)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reference_number ON itineraries(reference_number)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON itineraries(created_at)")
    
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_amadeus_order_id ON amadeus_bookings(amadeus_order_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_amadeus_pnr ON amadeus_bookings(pnr)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_amadeus_itinerary ON amadeus_bookings(itinerary_id)")
    
    conn.commit()
    conn.close()
    print(f"Database initialized at: {db_path}")


def get_connection():
    """Get database connection"""
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row  # Enable column access by name
    return conn


def save_itinerary(itinerary_dict: Dict[str, Any]) -> bool:
    """
    Save or update an itinerary in the database
    
    Args:
        itinerary_dict: Dictionary containing itinerary data
        
    Returns:
        True if successful, False otherwise
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        itinerary_id = itinerary_dict.get("itinerary_id")
        reference_number = itinerary_dict.get("reference_number")
        title = itinerary_dict.get("title", "")
        description = itinerary_dict.get("description")
        data_json = json.dumps(itinerary_dict, default=str)
        
        # Insert or replace (upsert)
        cursor.execute("""
            INSERT OR REPLACE INTO itineraries 
            (itinerary_id, reference_number, title, description, data_json, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (itinerary_id, reference_number, title, description, data_json))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving itinerary: {e}")
        return False


def get_itinerary(itinerary_id: str) -> Optional[Dict[str, Any]]:
    """
    Get an itinerary by ID
    
    Args:
        itinerary_id: The itinerary ID
        
    Returns:
        Dictionary containing itinerary data, or None if not found
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT data_json FROM itineraries 
            WHERE itinerary_id = ?
        """, (itinerary_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return json.loads(row["data_json"])
        return None
    except Exception as e:
        print(f"Error getting itinerary: {e}")
        return None


def get_all_itineraries() -> List[Dict[str, Any]]:
    """
    Get all itineraries
    
    Returns:
        List of itinerary dictionaries
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT data_json FROM itineraries 
            ORDER BY created_at DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        itineraries = []
        for row in rows:
            try:
                itinerary = json.loads(row["data_json"])
                itineraries.append(itinerary)
            except json.JSONDecodeError as e:
                print(f"Error parsing itinerary JSON: {e}")
                continue
        
        return itineraries
    except Exception as e:
        print(f"Error getting all itineraries: {e}")
        return []


def delete_itinerary(itinerary_id: str) -> bool:
    """
    Delete an itinerary by ID
    
    Args:
        itinerary_id: The itinerary ID
        
    Returns:
        True if deleted, False otherwise
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM itineraries 
            WHERE itinerary_id = ?
        """, (itinerary_id,))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted
    except Exception as e:
        print(f"Error deleting itinerary: {e}")
        return False


def get_itinerary_by_reference(reference_number: str) -> Optional[Dict[str, Any]]:
    """
    Get an itinerary by reference number
    
    Args:
        reference_number: The reference number
        
    Returns:
        Dictionary containing itinerary data, or None if not found
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT data_json FROM itineraries 
            WHERE reference_number = ?
            ORDER BY created_at DESC
            LIMIT 1
        """, (reference_number,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return json.loads(row["data_json"])
        return None
    except Exception as e:
        print(f"Error getting itinerary by reference: {e}")
        return None


def count_itineraries() -> int:
    """
    Get the total number of itineraries
    
    Returns:
        Count of itineraries
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM itineraries")
        row = cursor.fetchone()
        conn.close()
        
        return row["count"] if row else 0
    except Exception as e:
        print(f"Error counting itineraries: {e}")
        return 0


def save_amadeus_booking(
    booking_id: str,
    amadeus_order_id: str,
    pnr: Optional[str],
    itinerary_id: Optional[str],
    flight_booking_id: Optional[str],
    booking_data: Dict[str, Any],
    status: str = "confirmed"
) -> bool:
    """
    Save or update an Amadeus booking reference
    
    Args:
        booking_id: Internal booking ID
        amadeus_order_id: Amadeus order ID
        pnr: PNR/confirmation number
        itinerary_id: Associated itinerary ID
        flight_booking_id: Associated flight booking ID
        booking_data: Full booking data from Amadeus
        status: Booking status
        
    Returns:
        True if successful, False otherwise
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        booking_data_json = json.dumps(booking_data, default=str)
        
        cursor.execute("""
            INSERT OR REPLACE INTO amadeus_bookings 
            (booking_id, amadeus_order_id, pnr, itinerary_id, flight_booking_id, 
             booking_data_json, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (booking_id, amadeus_order_id, pnr, itinerary_id, flight_booking_id, 
              booking_data_json, status))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error saving Amadeus booking: {e}")
        return False


def get_amadeus_booking_by_order_id(amadeus_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Get Amadeus booking by order ID
    
    Args:
        amadeus_order_id: Amadeus order ID
        
    Returns:
        Dictionary containing booking data, or None if not found
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM amadeus_bookings 
            WHERE amadeus_order_id = ?
        """, (amadeus_order_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "booking_id": row["booking_id"],
                "amadeus_order_id": row["amadeus_order_id"],
                "pnr": row["pnr"],
                "itinerary_id": row["itinerary_id"],
                "flight_booking_id": row["flight_booking_id"],
                "status": row["status"],
                "booking_data": json.loads(row["booking_data_json"]) if row["booking_data_json"] else None,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
        return None
    except Exception as e:
        print(f"Error getting Amadeus booking: {e}")
        return None


def get_amadeus_booking_by_pnr(pnr: str) -> Optional[Dict[str, Any]]:
    """
    Get Amadeus booking by PNR
    
    Args:
        pnr: PNR/confirmation number
        
    Returns:
        Dictionary containing booking data, or None if not found
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM amadeus_bookings 
            WHERE pnr = ?
        """, (pnr,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "booking_id": row["booking_id"],
                "amadeus_order_id": row["amadeus_order_id"],
                "pnr": row["pnr"],
                "itinerary_id": row["itinerary_id"],
                "flight_booking_id": row["flight_booking_id"],
                "status": row["status"],
                "booking_data": json.loads(row["booking_data_json"]) if row["booking_data_json"] else None,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }
        return None
    except Exception as e:
        print(f"Error getting Amadeus booking by PNR: {e}")
        return None


def update_amadeus_booking_status(amadeus_order_id: str, status: str) -> bool:
    """
    Update Amadeus booking status
    
    Args:
        amadeus_order_id: Amadeus order ID
        status: New status
        
    Returns:
        True if updated, False otherwise
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE amadeus_bookings 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE amadeus_order_id = ?
        """, (status, amadeus_order_id))
        
        updated = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return updated
    except Exception as e:
        print(f"Error updating Amadeus booking status: {e}")
        return False


# User and Organization functions
def create_organization(name: str, slug: str, **kwargs) -> Optional[str]:
    """Create a new organization"""
    import uuid
    org_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO organizations (id, name, slug, logo_url, contact_phone, 
                                     contact_email, whatsapp_number, settings_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            org_id, name, slug,
            kwargs.get('logo_url'),
            kwargs.get('contact_phone'),
            kwargs.get('contact_email'),
            kwargs.get('whatsapp_number'),
            json.dumps(kwargs.get('settings', {}))
        ))
        
        conn.commit()
        conn.close()
        return org_id
    except Exception as e:
        print(f"Error creating organization: {e}")
        return None


def get_organization_by_id(org_id: str) -> Optional[Dict]:
    """Get organization by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM organizations WHERE id = ?", (org_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting organization: {e}")
        return None


def create_user(email: str, password_hash: str, name: str, 
                organization_id: str, role: str = "agent") -> Optional[str]:
    """Create a new user"""
    import uuid
    user_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO users (id, organization_id, email, password_hash, name, role)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, organization_id, email, password_hash, name, role))
        
        conn.commit()
        conn.close()
        return user_id
    except Exception as e:
        print(f"Error creating user: {e}")
        return None


def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def create_traveler(organization_id: str, first_name: str, last_name: str,
                   phone: str, **kwargs) -> Optional[str]:
    """Create a new traveler"""
    import uuid
    traveler_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO travelers (id, organization_id, first_name, last_name, 
                                 email, phone, phone_country_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            traveler_id, organization_id, first_name, last_name,
            kwargs.get('email'), phone, kwargs.get('phone_country_code')
        ))
        
        conn.commit()
        conn.close()
        return traveler_id
    except Exception as e:
        print(f"Error creating traveler: {e}")
        return None


def get_traveler_by_id(traveler_id: str) -> Optional[Dict]:
    """Get traveler by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM travelers WHERE id = ?", (traveler_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting traveler: {e}")
        return None


def generate_booking_code() -> str:
    """Generate a random 6-character booking code"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def create_booking(organization_id: str, created_by: str, traveler_id: str,
                  title: str, start_date: str, end_date: str, **kwargs) -> Optional[str]:
    """Create a new booking"""
    import uuid
    booking_id = str(uuid.uuid4())
    booking_code = kwargs.get('booking_code') or generate_booking_code()
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO bookings (id, organization_id, created_by, traveler_id,
                                booking_code, title, status, start_date, end_date,
                                notes, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id, organization_id, created_by, traveler_id,
            booking_code, title, kwargs.get('status', 'draft'),
            start_date, end_date, kwargs.get('notes'),
            json.dumps(kwargs.get('metadata', {}))
        ))
        
        conn.commit()
        conn.close()
        return booking_id
    except Exception as e:
        print(f"Error creating booking: {e}")
        return None


def get_booking_by_id(booking_id: str) -> Optional[Dict]:
    """Get booking by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting booking: {e}")
        return None


def get_booking_by_code(booking_code: str) -> Optional[Dict]:
    """Get booking by booking code"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM bookings WHERE booking_code = ?", (booking_code,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    except Exception as e:
        print(f"Error getting booking by code: {e}")
        return None


def get_bookings_by_organization(organization_id: str, status: Optional[str] = None) -> List[Dict]:
    """Get all bookings for an organization"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT * FROM bookings 
                WHERE organization_id = ? AND status = ?
                ORDER BY created_at DESC
            """, (organization_id, status))
        else:
            cursor.execute("""
                SELECT * FROM bookings 
                WHERE organization_id = ?
                ORDER BY created_at DESC
            """, (organization_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting bookings: {e}")
        return []


def create_flight(booking_id: str, carrier_code: str, flight_number: str,
                 departure_date: str, departure_airport: str, arrival_airport: str,
                 scheduled_departure: str, scheduled_arrival: str, **kwargs) -> Optional[str]:
    """Create a flight record"""
    import uuid
    flight_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO flights (id, booking_id, carrier_code, flight_number,
                               departure_date, departure_airport, arrival_airport,
                               scheduled_departure, scheduled_arrival,
                               estimated_departure, estimated_arrival,
                               departure_terminal, arrival_terminal,
                               departure_gate, arrival_gate, status,
                               aircraft_code, airline_name, checkin_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            flight_id, booking_id, carrier_code, flight_number,
            departure_date, departure_airport, arrival_airport,
            scheduled_departure, scheduled_arrival,
            kwargs.get('estimated_departure'), kwargs.get('estimated_arrival'),
            kwargs.get('departure_terminal'), kwargs.get('arrival_terminal'),
            kwargs.get('departure_gate'), kwargs.get('arrival_gate'),
            kwargs.get('status', 'SCHEDULED'),
            kwargs.get('aircraft_code'), kwargs.get('airline_name'),
            kwargs.get('checkin_url')
        ))
        
        conn.commit()
        conn.close()
        return flight_id
    except Exception as e:
        print(f"Error creating flight: {e}")
        return None


def get_flights_by_booking(booking_id: str) -> List[Dict]:
    """Get all flights for a booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM flights 
            WHERE booking_id = ?
            ORDER BY scheduled_departure
        """, (booking_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting flights: {e}")
        return []


def get_active_flights_for_monitoring() -> List[Dict]:
    """Get flights that need monitoring (departure within 48 hours)"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get flights departing within 48 hours
        cursor.execute("""
            SELECT * FROM flights 
            WHERE scheduled_departure > datetime('now')
            AND scheduled_departure < datetime('now', '+48 hours')
            AND status != 'CANCELLED'
            ORDER BY scheduled_departure
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting active flights: {e}")
        return []


def update_flight_status(flight_id: str, status: str, **kwargs) -> bool:
    """Update flight status and related fields"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = ["status = ?", "updated_at = CURRENT_TIMESTAMP", "last_status_check = CURRENT_TIMESTAMP"]
        values = [status]
        
        if 'estimated_departure' in kwargs:
            updates.append("estimated_departure = ?")
            values.append(kwargs['estimated_departure'])
        if 'estimated_arrival' in kwargs:
            updates.append("estimated_arrival = ?")
            values.append(kwargs['estimated_arrival'])
        if 'departure_gate' in kwargs:
            updates.append("departure_gate = ?")
            values.append(kwargs['departure_gate'])
        if 'arrival_gate' in kwargs:
            updates.append("arrival_gate = ?")
            values.append(kwargs['arrival_gate'])
        if 'departure_terminal' in kwargs:
            updates.append("departure_terminal = ?")
            values.append(kwargs['departure_terminal'])
        if 'arrival_terminal' in kwargs:
            updates.append("arrival_terminal = ?")
            values.append(kwargs['arrival_terminal'])
        
        values.append(flight_id)
        
        cursor.execute(f"""
            UPDATE flights 
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating flight status: {e}")
        return False


def create_flight_change(flight_id: str, change_type: str, 
                        previous_value: str, new_value: str) -> Optional[str]:
    """Record a flight status change"""
    import uuid
    change_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO flight_changes (id, flight_id, change_type, previous_value, new_value)
            VALUES (?, ?, ?, ?, ?)
        """, (change_id, flight_id, change_type, previous_value, new_value))
        
        conn.commit()
        conn.close()
        return change_id
    except Exception as e:
        print(f"Error creating flight change: {e}")
        return None


def create_notification(booking_id: str, traveler_id: str, notification_type: str,
                       channel: str, recipient: str, template_name: str = None,
                       template_data: Dict = None) -> Optional[str]:
    """Create a notification record"""
    import uuid
    notification_id = str(uuid.uuid4())
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO notifications (id, booking_id, traveler_id, notification_type,
                                     channel, recipient, template_name, template_data_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notification_id, booking_id, traveler_id, notification_type,
            channel, recipient, template_name,
            json.dumps(template_data or {}), 'pending'
        ))
        
        conn.commit()
        conn.close()
        return notification_id
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


def update_notification_status(notification_id: str, status: str, 
                               error_message: str = None) -> bool:
    """Update notification status"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        if status == 'sent':
            cursor.execute("""
                UPDATE notifications 
                SET status = ?, sent_at = CURRENT_TIMESTAMP, retry_count = retry_count + 1
                WHERE id = ?
            """, (status, notification_id))
        elif status == 'delivered':
            cursor.execute("""
                UPDATE notifications 
                SET status = ?, delivered_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, notification_id))
        elif status == 'failed':
            cursor.execute("""
                UPDATE notifications 
                SET status = ?, error_message = ?, retry_count = retry_count + 1
                WHERE id = ?
            """, (status, error_message, notification_id))
        else:
            cursor.execute("""
                UPDATE notifications 
                SET status = ?
                WHERE id = ?
            """, (status, notification_id))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating notification: {e}")
        return False


def get_pending_notifications(limit: int = 100) -> List[Dict]:
    """Get pending notifications ordered by priority"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM notifications 
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT ?
        """, (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting pending notifications: {e}")
        return []

