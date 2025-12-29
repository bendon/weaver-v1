"""
Database module for TravelWeaver Platform
Implements the complete SQLite schema from the specification
"""

import sqlite3
import json
import secrets
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path
from app.core.config import settings


def get_db_path() -> Path:
    """Get database file path, creating directory if needed"""
    # Extract path from DATABASE_URL (sqlite:///./data/travelweaver.db)
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///"):
        db_path = Path(db_url.replace("sqlite:///", ""))
    else:
        db_path = Path(__file__).parent.parent.parent / "data" / "travelweaver.db"
    
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return db_path


def get_connection():
    """Get database connection"""
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def generate_id() -> str:
    """Generate a random lowercase hex ID"""
    return secrets.token_hex(8)


def init_database():
    """
    Initialize the database with the complete schema from the specification
    """
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # ============================================================
    # ORGANIZATIONS (DMCs)
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS organizations (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            logo_url TEXT,
            contact_phone TEXT,
            contact_email TEXT,
            whatsapp_number TEXT,
            address TEXT,
            city TEXT,
            country TEXT,
            timezone TEXT DEFAULT 'Africa/Nairobi',
            settings TEXT DEFAULT '{}',
            subscription_tier TEXT DEFAULT 'starter',
            subscription_expires_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # USERS (DMC Staff)
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
            is_active INTEGER DEFAULT 1,
            last_login_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # TRAVELERS
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS travelers (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            phone TEXT NOT NULL,
            phone_country_code TEXT DEFAULT '+1',
            date_of_birth TEXT,
            passport_number TEXT,
            passport_expiry TEXT,
            nationality TEXT,
            dietary_requirements TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # BOOKINGS
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            created_by_user_id TEXT REFERENCES users(id),
            booking_code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'active', 'completed', 'cancelled')),
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            total_travelers INTEGER DEFAULT 1,
            total_price REAL,
            currency TEXT DEFAULT 'USD',
            notes TEXT,
            metadata TEXT DEFAULT '{}',
            amadeus_pnr TEXT,
            itinerary_sent_at TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # BOOKING_TRAVELERS (Many-to-Many)
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS booking_travelers (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            traveler_id TEXT NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
            is_primary INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(booking_id, traveler_id)
        )
    """)
    
    # ============================================================
    # FLIGHTS
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flights (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            flight_type TEXT DEFAULT 'outbound' CHECK (flight_type IN ('outbound', 'return', 'internal')),
            carrier_code TEXT NOT NULL,
            flight_number TEXT NOT NULL,
            departure_date TEXT NOT NULL,
            departure_airport TEXT NOT NULL,
            arrival_airport TEXT NOT NULL,
            scheduled_departure TEXT NOT NULL,
            scheduled_arrival TEXT NOT NULL,
            estimated_departure TEXT,
            estimated_arrival TEXT,
            actual_departure TEXT,
            actual_arrival TEXT,
            departure_terminal TEXT,
            arrival_terminal TEXT,
            departure_gate TEXT,
            arrival_gate TEXT,
            status TEXT DEFAULT 'scheduled' CHECK (status IN (
                'scheduled', 'delayed', 'boarding', 'departed', 
                'in_air', 'landed', 'cancelled', 'diverted'
            )),
            delay_minutes INTEGER DEFAULT 0,
            aircraft_code TEXT,
            airline_name TEXT,
            checkin_url TEXT,
            amadeus_offer_id TEXT,
            last_status_check TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # HOTELS
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hotels (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            hotel_name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            country TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            latitude REAL,
            longitude REAL,
            confirmation_number TEXT,
            check_in_date TEXT NOT NULL,
            check_in_time TEXT DEFAULT '14:00',
            check_out_date TEXT NOT NULL,
            check_out_time TEXT DEFAULT '11:00',
            room_type TEXT,
            board_basis TEXT,
            price REAL,
            currency TEXT DEFAULT 'USD',
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # TRANSFERS
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transfers (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            transfer_type TEXT CHECK (transfer_type IN (
                'airport_pickup', 'airport_dropoff', 'intercity', 'game_drive', 'other'
            )),
            scheduled_datetime TEXT NOT NULL,
            from_location TEXT NOT NULL,
            to_location TEXT NOT NULL,
            vehicle_type TEXT,
            driver_name TEXT,
            driver_phone TEXT,
            supplier_name TEXT,
            confirmation_number TEXT,
            price REAL,
            currency TEXT DEFAULT 'USD',
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # ACTIVITIES
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            activity_name TEXT NOT NULL,
            activity_type TEXT,
            scheduled_datetime TEXT NOT NULL,
            duration_minutes INTEGER,
            location TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            supplier_name TEXT,
            confirmation_number TEXT,
            price REAL,
            currency TEXT DEFAULT 'USD',
            description TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # FLIGHT STATUS CHANGES (Audit Log)
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flight_changes (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            flight_id TEXT NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
            change_type TEXT NOT NULL CHECK (change_type IN (
                'delay', 'gate_change', 'terminal_change', 
                'cancellation', 'diversion', 'back_on_time'
            )),
            previous_value TEXT,
            new_value TEXT,
            detected_at TEXT DEFAULT (datetime('now')),
            notification_sent INTEGER DEFAULT 0
        )
    """)
    
    # ============================================================
    # MESSAGES
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
            traveler_id TEXT REFERENCES travelers(id) ON DELETE SET NULL,
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
            channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
            message_type TEXT,
            recipient TEXT NOT NULL,
            content TEXT NOT NULL,
            template_data TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN (
                'pending', 'sent', 'delivered', 'read', 'failed'
            )),
            external_id TEXT,
            error_message TEXT,
            sent_at TEXT,
            delivered_at TEXT,
            read_at TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # SCHEDULED MESSAGES
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
            trigger_name TEXT NOT NULL,
            scheduled_for TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
            message_id TEXT REFERENCES messages(id),
            skip_reason TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            processed_at TEXT
        )
    """)
    
    # ============================================================
    # AUTOMATION RULES
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS automation_rules (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            trigger_name TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            template_override TEXT,
            settings TEXT DEFAULT '{}',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            UNIQUE(organization_id, trigger_name)
        )
    """)
    
    # ============================================================
    # AI CONVERSATIONS (Booking Assistant)
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            user_id TEXT REFERENCES users(id),
            booking_id TEXT REFERENCES bookings(id),
            conversation_type TEXT DEFAULT 'booking',
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # AI CONVERSATION MESSAGES
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversation_messages (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
            content TEXT NOT NULL,
            tool_calls TEXT,
            tool_results TEXT,
            tokens_used INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # REFERENCE DATA CACHE
    # ============================================================
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airports (
            iata_code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT,
            country TEXT,
            timezone TEXT,
            latitude REAL,
            longitude REAL,
            cached_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS airlines (
            iata_code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            checkin_url TEXT,
            cached_at TEXT DEFAULT (datetime('now'))
        )
    """)
    
    # ============================================================
    # CREATE INDEXES
    # ============================================================
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)",
        "CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id)",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_travelers_organization ON travelers(organization_id)",
        "CREATE INDEX IF NOT EXISTS idx_travelers_phone ON travelers(phone)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_organization ON bookings(organization_id)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)",
        "CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date)",
        "CREATE INDEX IF NOT EXISTS idx_booking_travelers_booking ON booking_travelers(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_flights_booking ON flights(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights(departure_date)",
        "CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status)",
        "CREATE INDEX IF NOT EXISTS idx_hotels_booking ON hotels(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_transfers_booking ON transfers(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_activities_booking ON activities(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_flight_changes_flight ON flight_changes(flight_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id)",
        "CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)",
        "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status)",
        "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled ON scheduled_messages(scheduled_for)",
        "CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id)",
        "CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id)",
        "CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON conversation_messages(conversation_id)",
    ]
    
    for index_sql in indexes:
        cursor.execute(index_sql)
    
    # ============================================================
    # CREATE VIEWS
    # ============================================================
    cursor.execute("""
        CREATE VIEW IF NOT EXISTS v_active_bookings AS
        SELECT 
            b.*,
            t.first_name || ' ' || t.last_name as primary_traveler_name,
            t.phone as primary_traveler_phone,
            o.name as organization_name
        FROM bookings b
        LEFT JOIN booking_travelers bt ON b.id = bt.booking_id AND bt.is_primary = 1
        LEFT JOIN travelers t ON bt.traveler_id = t.id
        LEFT JOIN organizations o ON b.organization_id = o.id
        WHERE b.status IN ('confirmed', 'active')
    """)
    
    cursor.execute("""
        CREATE VIEW IF NOT EXISTS v_flights_to_monitor AS
        SELECT f.*, b.booking_code, b.organization_id
        FROM flights f
        JOIN bookings b ON f.booking_id = b.id
        WHERE f.status NOT IN ('landed', 'cancelled')
        AND datetime(f.scheduled_departure) > datetime('now', '-6 hours')
        AND datetime(f.scheduled_departure) < datetime('now', '+48 hours')
    """)
    
    cursor.execute("""
        CREATE VIEW IF NOT EXISTS v_pending_scheduled_messages AS
        SELECT 
            sm.*,
            b.booking_code,
            t.first_name,
            t.phone
        FROM scheduled_messages sm
        JOIN bookings b ON sm.booking_id = b.id
        JOIN booking_travelers bt ON b.id = bt.booking_id AND bt.is_primary = 1
        JOIN travelers t ON bt.traveler_id = t.id
        WHERE sm.status = 'pending'
        AND datetime(sm.scheduled_for) <= datetime('now')
    """)
    
    # ============================================================
    # CREATE TRIGGERS FOR updated_at
    # ============================================================
    triggers = [
        """
        CREATE TRIGGER IF NOT EXISTS update_organizations_timestamp 
        AFTER UPDATE ON organizations
        BEGIN
            UPDATE organizations SET updated_at = datetime('now') WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users
        BEGIN
            UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_bookings_timestamp 
        AFTER UPDATE ON bookings
        BEGIN
            UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id;
        END
        """,
        """
        CREATE TRIGGER IF NOT EXISTS update_flights_timestamp 
        AFTER UPDATE ON flights
        BEGIN
            UPDATE flights SET updated_at = datetime('now') WHERE id = NEW.id;
        END
        """,
    ]
    
    for trigger_sql in triggers:
        cursor.execute(trigger_sql)
    
    # ============================================================
    # SEED DATA (if needed)
    # ============================================================
    # Check if demo organization exists
    cursor.execute("SELECT id FROM organizations WHERE slug = 'safari-dreams'")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO organizations (id, name, slug, contact_phone, whatsapp_number, city, country)
            VALUES (
                'org_demo',
                'Safari Dreams Kenya',
                'safari-dreams',
                '+254722123456',
                '+254722123456',
                'Nairobi',
                'Kenya'
            )
        """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized at: {db_path}")


# ============================================================
# DATABASE HELPER FUNCTIONS
# ============================================================

def create_organization(name: str, slug: str, **kwargs) -> Optional[str]:
    """Create a new organization"""
    import secrets
    org_id = f"org_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO organizations (id, name, slug, logo_url, contact_phone, 
                                     contact_email, whatsapp_number, address, city, country, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            org_id, name, slug,
            kwargs.get('logo_url'),
            kwargs.get('contact_phone'),
            kwargs.get('contact_email'),
            kwargs.get('whatsapp_number'),
            kwargs.get('address'),
            kwargs.get('city'),
            kwargs.get('country'),
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
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting organization: {e}")
        return None


def create_user(email: str, password_hash: str, name: str, 
                organization_id: str, role: str = "agent") -> Optional[str]:
    """Create a new user"""
    import secrets
    user_id = f"usr_{secrets.token_hex(8)}"
    
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
        return dict(row) if row else None
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
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None


def create_traveler(organization_id: str, first_name: str, last_name: str,
                   phone: str, **kwargs) -> Optional[str]:
    """Create a new traveler"""
    import secrets
    traveler_id = f"trv_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO travelers (id, organization_id, first_name, last_name, 
                                 email, phone, phone_country_code, date_of_birth,
                                 passport_number, passport_expiry, nationality, dietary_requirements, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            traveler_id, organization_id, first_name, last_name,
            kwargs.get('email'), phone, kwargs.get('phone_country_code', '+1'),
            kwargs.get('date_of_birth'), kwargs.get('passport_number'),
            kwargs.get('passport_expiry'), kwargs.get('nationality'),
            kwargs.get('dietary_requirements'), kwargs.get('notes')
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
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting traveler: {e}")
        return None


def generate_booking_code() -> str:
    """Generate a random 6-character booking code"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


def create_booking(organization_id: str, created_by: str, title: str, 
                  start_date: str, end_date: str, **kwargs) -> Optional[str]:
    """Create a new booking"""
    import secrets
    booking_id = f"bkg_{secrets.token_hex(8)}"
    booking_code = kwargs.get('booking_code') or generate_booking_code()
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO bookings (id, organization_id, created_by_user_id,
                                booking_code, title, status, start_date, end_date,
                                total_travelers, total_price, currency, notes, metadata, amadeus_pnr)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            booking_id, organization_id, created_by,
            booking_code, title, kwargs.get('status', 'draft'),
            start_date, end_date,
            kwargs.get('total_travelers', 1), kwargs.get('total_price'),
            kwargs.get('currency', 'USD'), kwargs.get('notes'),
            json.dumps(kwargs.get('metadata', {})), kwargs.get('amadeus_pnr')
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
        return dict(row) if row else None
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
        return dict(row) if row else None
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


# ============================================================
# BOOKING-TRAVELER LINKING
# ============================================================

def link_traveler_to_booking(booking_id: str, traveler_id: str, is_primary: bool = False) -> Optional[str]:
    """Link a traveler to a booking"""
    import secrets
    link_id = f"bt_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO booking_travelers (id, booking_id, traveler_id, is_primary)
            VALUES (?, ?, ?, ?)
        """, (link_id, booking_id, traveler_id, 1 if is_primary else 0))
        conn.commit()
        conn.close()
        return link_id
    except Exception as e:
        print(f"Error linking traveler to booking: {e}")
        return None


def get_booking_travelers(booking_id: str) -> List[Dict]:
    """Get all travelers for a booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT bt.*, t.* 
            FROM booking_travelers bt
            JOIN travelers t ON bt.traveler_id = t.id
            WHERE bt.booking_id = ?
            ORDER BY bt.is_primary DESC, bt.created_at
        """, (booking_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting booking travelers: {e}")
        return []


# ============================================================
# FLIGHTS
# ============================================================

def create_flight(booking_id: str, carrier_code: str, flight_number: str,
                 departure_date: str, departure_airport: str, arrival_airport: str,
                 scheduled_departure: str, scheduled_arrival: str, **kwargs) -> Optional[str]:
    """Create a flight record"""
    import secrets
    flight_id = f"flt_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO flights (id, booking_id, flight_type, carrier_code, flight_number,
                               departure_date, departure_airport, arrival_airport,
                               scheduled_departure, scheduled_arrival,
                               estimated_departure, estimated_arrival,
                               departure_terminal, arrival_terminal,
                               departure_gate, arrival_gate, status,
                               delay_minutes, aircraft_code, airline_name, checkin_url, amadeus_offer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            flight_id, booking_id, kwargs.get('flight_type', 'outbound'),
            carrier_code, flight_number, departure_date, departure_airport, arrival_airport,
            scheduled_departure, scheduled_arrival,
            kwargs.get('estimated_departure'), kwargs.get('estimated_arrival'),
            kwargs.get('departure_terminal'), kwargs.get('arrival_terminal'),
            kwargs.get('departure_gate'), kwargs.get('arrival_gate'),
            kwargs.get('status', 'scheduled'), kwargs.get('delay_minutes', 0),
            kwargs.get('aircraft_code'), kwargs.get('airline_name'),
            kwargs.get('checkin_url'), kwargs.get('amadeus_offer_id')
        ))
        conn.commit()
        conn.close()
        return flight_id
    except Exception as e:
        print(f"Error creating flight: {e}")
        return None


def get_flight_by_id(flight_id: str) -> Optional[Dict]:
    """Get flight by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM flights WHERE id = ?", (flight_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting flight: {e}")
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


def update_flight(flight_id: str, **kwargs) -> bool:
    """Update flight"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(flight_id)
        cursor.execute(f"""
            UPDATE flights 
            SET {', '.join(updates)}, updated_at = datetime('now')
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating flight: {e}")
        return False


def delete_flight(flight_id: str) -> bool:
    """Delete flight"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM flights WHERE id = ?", (flight_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting flight: {e}")
        return False


# ============================================================
# HOTELS
# ============================================================

def create_hotel(booking_id: str, hotel_name: str, check_in_date: str, 
                check_out_date: str, **kwargs) -> Optional[str]:
    """Create a hotel reservation"""
    import secrets
    hotel_id = f"htl_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO hotels (id, booking_id, hotel_name, address, city, country,
                              phone, email, website, latitude, longitude,
                              confirmation_number, check_in_date, check_in_time,
                              check_out_date, check_out_time, room_type, board_basis,
                              price, currency, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            hotel_id, booking_id, hotel_name,
            kwargs.get('address'), kwargs.get('city'), kwargs.get('country'),
            kwargs.get('phone'), kwargs.get('email'), kwargs.get('website'),
            kwargs.get('latitude'), kwargs.get('longitude'),
            kwargs.get('confirmation_number'), check_in_date,
            kwargs.get('check_in_time', '14:00'), check_out_date,
            kwargs.get('check_out_time', '11:00'), kwargs.get('room_type'),
            kwargs.get('board_basis'), kwargs.get('price'), kwargs.get('currency', 'USD'),
            kwargs.get('notes')
        ))
        conn.commit()
        conn.close()
        return hotel_id
    except Exception as e:
        print(f"Error creating hotel: {e}")
        return None


def get_hotel_by_id(hotel_id: str) -> Optional[Dict]:
    """Get hotel by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM hotels WHERE id = ?", (hotel_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting hotel: {e}")
        return None


def get_hotels_by_booking(booking_id: str) -> List[Dict]:
    """Get all hotels for a booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM hotels 
            WHERE booking_id = ?
            ORDER BY check_in_date
        """, (booking_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting hotels: {e}")
        return []


def update_hotel(hotel_id: str, **kwargs) -> bool:
    """Update hotel"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(hotel_id)
        cursor.execute(f"""
            UPDATE hotels 
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating hotel: {e}")
        return False


def delete_hotel(hotel_id: str) -> bool:
    """Delete hotel"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM hotels WHERE id = ?", (hotel_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting hotel: {e}")
        return False


# ============================================================
# TRANSFERS
# ============================================================

def create_transfer(booking_id: str, scheduled_datetime: str, from_location: str,
                   to_location: str, **kwargs) -> Optional[str]:
    """Create a transfer"""
    import secrets
    transfer_id = f"trf_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transfers (id, booking_id, transfer_type, scheduled_datetime,
                                 from_location, to_location, vehicle_type,
                                 driver_name, driver_phone, supplier_name,
                                 confirmation_number, price, currency, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            transfer_id, booking_id, kwargs.get('transfer_type'),
            scheduled_datetime, from_location, to_location,
            kwargs.get('vehicle_type'), kwargs.get('driver_name'),
            kwargs.get('driver_phone'), kwargs.get('supplier_name'),
            kwargs.get('confirmation_number'), kwargs.get('price'),
            kwargs.get('currency', 'USD'), kwargs.get('notes')
        ))
        conn.commit()
        conn.close()
        return transfer_id
    except Exception as e:
        print(f"Error creating transfer: {e}")
        return None


def get_transfer_by_id(transfer_id: str) -> Optional[Dict]:
    """Get transfer by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting transfer: {e}")
        return None


def get_transfers_by_booking(booking_id: str) -> List[Dict]:
    """Get all transfers for a booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM transfers 
            WHERE booking_id = ?
            ORDER BY scheduled_datetime
        """, (booking_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting transfers: {e}")
        return []


def update_transfer(transfer_id: str, **kwargs) -> bool:
    """Update transfer"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(transfer_id)
        cursor.execute(f"""
            UPDATE transfers 
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating transfer: {e}")
        return False


def delete_transfer(transfer_id: str) -> bool:
    """Delete transfer"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transfers WHERE id = ?", (transfer_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting transfer: {e}")
        return False


# ============================================================
# ACTIVITIES
# ============================================================

def create_activity(booking_id: str, activity_name: str, scheduled_datetime: str, **kwargs) -> Optional[str]:
    """Create an activity"""
    import secrets
    activity_id = f"act_{secrets.token_hex(8)}"
    
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO activities (id, booking_id, activity_name, activity_type,
                                  scheduled_datetime, duration_minutes, location, address,
                                  latitude, longitude, supplier_name, confirmation_number,
                                  price, currency, description, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity_id, booking_id, activity_name, kwargs.get('activity_type'),
            scheduled_datetime, kwargs.get('duration_minutes'), kwargs.get('location'),
            kwargs.get('address'), kwargs.get('latitude'), kwargs.get('longitude'),
            kwargs.get('supplier_name'), kwargs.get('confirmation_number'),
            kwargs.get('price'), kwargs.get('currency', 'USD'),
            kwargs.get('description'), kwargs.get('notes')
        ))
        conn.commit()
        conn.close()
        return activity_id
    except Exception as e:
        print(f"Error creating activity: {e}")
        return None


def get_activity_by_id(activity_id: str) -> Optional[Dict]:
    """Get activity by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM activities WHERE id = ?", (activity_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting activity: {e}")
        return None


def get_activities_by_booking(booking_id: str) -> List[Dict]:
    """Get all activities for a booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM activities 
            WHERE booking_id = ?
            ORDER BY scheduled_datetime
        """, (booking_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting activities: {e}")
        return []


def update_activity(activity_id: str, **kwargs) -> bool:
    """Update activity"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(activity_id)
        cursor.execute(f"""
            UPDATE activities 
            SET {', '.join(updates)}
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating activity: {e}")
        return False


def delete_activity(activity_id: str) -> bool:
    """Delete activity"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting activity: {e}")
        return False


# ============================================================
# TRAVELERS - Additional
# ============================================================

def get_travelers_by_organization(organization_id: str) -> List[Dict]:
    """Get all travelers for an organization"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM travelers 
            WHERE organization_id = ?
            ORDER BY created_at DESC
        """, (organization_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting travelers: {e}")
        return []


def update_traveler(traveler_id: str, **kwargs) -> bool:
    """Update traveler"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)
        
        if not updates:
            return False
        
        values.append(traveler_id)
        cursor.execute(f"""
            UPDATE travelers 
            SET {', '.join(updates)}, updated_at = datetime('now')
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating traveler: {e}")
        return False


# ============================================================
# BOOKINGS - Additional
# ============================================================

def update_booking(booking_id: str, **kwargs) -> bool:
    """Update booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                if key == 'metadata' and isinstance(value, dict):
                    updates.append(f"{key} = ?")
                    values.append(json.dumps(value))
                else:
                    updates.append(f"{key} = ?")
                    values.append(value)
        
        if not updates:
            return False
        
        values.append(booking_id)
        cursor.execute(f"""
            UPDATE bookings 
            SET {', '.join(updates)}, updated_at = datetime('now')
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating booking: {e}")
        return False


def delete_booking(booking_id: str) -> bool:
    """Delete booking"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    except Exception as e:
        print(f"Error deleting booking: {e}")
        return False


# ============================================================
# CONVERSATIONS (AI Chat)
# ============================================================

def create_conversation(
    organization_id: str,
    user_id: Optional[str] = None,
    booking_id: Optional[str] = None,
    conversation_type: str = "booking"
) -> str:
    """Create a new conversation"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        conversation_id = generate_id()

        cursor.execute("""
            INSERT INTO conversations (
                id, organization_id, user_id, booking_id, conversation_type, status
            ) VALUES (?, ?, ?, ?, ?, 'active')
        """, (conversation_id, organization_id, user_id, booking_id, conversation_type))

        conn.commit()
        conn.close()
        return conversation_id
    except Exception as e:
        print(f"Error creating conversation: {e}")
        return None


def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get conversation by ID"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f"Error getting conversation: {e}")
        return None


def get_conversations_by_user(user_id: str, organization_id: str) -> List[Dict[str, Any]]:
    """Get all conversations for a user"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM conversations
            WHERE user_id = ? AND organization_id = ?
            ORDER BY updated_at DESC
        """, (user_id, organization_id))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error getting conversations: {e}")
        return []


def update_conversation(conversation_id: str, **kwargs) -> bool:
    """Update conversation"""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        updates = []
        values = []
        for key, value in kwargs.items():
            if value is not None:
                updates.append(f"{key} = ?")
                values.append(value)

        if not updates:
            return False

        values.append(conversation_id)
        cursor.execute(f"""
            UPDATE conversations
            SET {', '.join(updates)}, updated_at = datetime('now')
            WHERE id = ?
        """, values)
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error updating conversation: {e}")
        return False


def add_conversation_message(
    conversation_id: str,
    role: str,
    content: str,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tool_call_id: Optional[str] = None
) -> str:
    """Add a message to a conversation"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        message_id = generate_id()

        tool_calls_json = json.dumps(tool_calls) if tool_calls else None

        cursor.execute("""
            INSERT INTO conversation_messages (
                id, conversation_id, role, content, tool_calls, tool_call_id
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (message_id, conversation_id, role, content, tool_calls_json, tool_call_id))

        # Update conversation's updated_at timestamp
        cursor.execute("""
            UPDATE conversations
            SET updated_at = datetime('now')
            WHERE id = ?
        """, (conversation_id,))

        conn.commit()
        conn.close()
        return message_id
    except Exception as e:
        print(f"Error adding conversation message: {e}")
        return None


def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
    """Get all messages in a conversation"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM conversation_messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
        """, (conversation_id,))
        rows = cursor.fetchall()
        conn.close()

        messages = []
        for row in rows:
            msg = dict(row)
            if msg.get('tool_calls'):
                try:
                    msg['tool_calls'] = json.loads(msg['tool_calls'])
                except:
                    msg['tool_calls'] = None
            messages.append(msg)

        return messages
    except Exception as e:
        print(f"Error getting conversation messages: {e}")
        return []

