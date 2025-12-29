#!/usr/bin/env python3
"""
Seed test data for user: Bendon Kipkirui Murgor

This script creates:
- User account (if doesn't exist)
- Organization
- Multiple bookings with travelers, flights, hotels, transfers, activities
"""

import sys
from pathlib import Path
from datetime import datetime, date, timedelta
import secrets

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import (
    init_database, get_connection, create_organization, 
    create_user, get_user_by_email, get_organization_by_id
)
from app.core.security import hash_password
from app.core.database import (
    create_booking, create_traveler, link_traveler_to_booking,
    create_flight, create_hotel, create_transfer, create_activity,
    get_bookings_by_organization
)


def seed_test_data():
    """Seed test data for Bendon Kipkirui Murgor"""
    
    print("=" * 60)
    print("  Seeding Test Data for Bendon Kipkirui Murgor")
    print("=" * 60)
    print()
    
    # Initialize database
    init_database()
    
    # User details
    user_email = "bendon@example.com"
    user_name = "Bendon Kipkirui Murgor"
    user_password = "password123"
    org_name = "Bendon Travel Services"
    org_slug = "bendon-travel"
    
    # Check if user exists
    user = get_user_by_email(user_email)
    
    if user:
        print(f"[OK] User already exists: {user_name}")
        org_id = user['organization_id']
        user_id = user['id']
    else:
        print(f"[*] Creating user: {user_name}")
        
        # Get or create organization
        from app.core.database import get_connection
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM organizations WHERE slug = ?", (org_slug,))
        existing_org = cursor.fetchone()
        
        if existing_org:
            org_id = existing_org[0]
            print(f"[OK] Using existing organization: {org_name} (ID: {org_id})")
        else:
            conn.close()
            org_id = create_organization(
                name=org_name,
                slug=org_slug,
                contact_phone="+254722123456",
                contact_email="info@bendontravel.com",
                whatsapp_number="+254722123456",
                city="Nairobi",
                country="Kenya"
            )
            
            if not org_id:
                print("[ERROR] Failed to create organization")
                return
            print(f"[OK] Created organization: {org_name} (ID: {org_id})")
        
        conn.close()
        
        # Create user
        password_hash = hash_password(user_password)
        user_id = create_user(
            email=user_email,
            password_hash=password_hash,
            name=user_name,
            organization_id=org_id,
            role="admin"
        )
        
        if not user_id:
            print("[ERROR] Failed to create user")
            print("   Note: If database is locked, try stopping the server first")
            return
        
        print(f"[OK] Created user: {user_name} (ID: {user_id})")
        print(f"   Email: {user_email}")
        print(f"   Password: {user_password}")
    
    # Get organization
    org = get_organization_by_id(org_id)
    print(f"\nOrganization: {org['name']}")
    print(f"   ID: {org_id}")
    
    # Check existing bookings
    existing_bookings = get_bookings_by_organization(org_id)
    if existing_bookings:
        print(f"\n[WARNING] Found {len(existing_bookings)} existing bookings")
        response = input("   Do you want to add more test data? (y/n): ")
        if response.lower() != 'y':
            print("   Skipping data creation")
            return
    
    print("\n[*] Creating test bookings...")
    
    # ==================== BOOKING 1: Kenya Safari ====================
    print("\n1. Creating Kenya Safari booking...")
    
    booking1_id = create_booking(
        organization_id=org_id,
        created_by=user_id,
        title="Kenya Safari Adventure",
        start_date=(date.today() + timedelta(days=30)).isoformat(),
        end_date=(date.today() + timedelta(days=37)).isoformat(),
        status="confirmed",
        total_travelers=2,
        total_price=4500.00,
        currency="USD",
        notes="Luxury safari experience in Masai Mara"
    )
    
    if booking1_id:
        print(f"   [OK] Booking created: {booking1_id}")
        
        # Travelers
        traveler1_id = create_traveler(
            organization_id=org_id,
            first_name="John",
            last_name="Smith",
            phone="+447700900123",
            email="john.smith@example.com",
            phone_country_code="+44",
            date_of_birth="1985-03-15",
            passport_number="AB123456",
            passport_expiry="2028-06-01",
            nationality="GB"
        )
        
        traveler2_id = create_traveler(
            organization_id=org_id,
            first_name="Jane",
            last_name="Smith",
            phone="+447700900124",
            email="jane.smith@example.com",
            phone_country_code="+44",
            date_of_birth="1987-07-22",
            passport_number="CD789012",
            passport_expiry="2027-09-15",
            nationality="GB"
        )
        
        link_traveler_to_booking(booking1_id, traveler1_id, is_primary=True)
        link_traveler_to_booking(booking1_id, traveler2_id, is_primary=False)
        print(f"   [OK] Added 2 travelers")
        
        # Flights
        flight1_id = create_flight(
            booking_id=booking1_id,
            carrier_code="KQ",
            flight_number="101",
            departure_date=(date.today() + timedelta(days=30)).isoformat(),
            departure_airport="LHR",
            arrival_airport="NBO",
            scheduled_departure=(datetime.now() + timedelta(days=30)).replace(hour=21, minute=45).isoformat(),
            scheduled_arrival=(datetime.now() + timedelta(days=31)).replace(hour=7, minute=30).isoformat(),
            flight_type="outbound",
            airline_name="Kenya Airways",
            status="scheduled"
        )
        
        flight2_id = create_flight(
            booking_id=booking1_id,
            carrier_code="KQ",
            flight_number="100",
            departure_date=(date.today() + timedelta(days=36)).isoformat(),
            departure_airport="NBO",
            arrival_airport="LHR",
            scheduled_departure=(datetime.now() + timedelta(days=36)).replace(hour=23, minute=55).isoformat(),
            scheduled_arrival=(datetime.now() + timedelta(days=37)).replace(hour=5, minute=45).isoformat(),
            flight_type="return",
            airline_name="Kenya Airways",
            status="scheduled"
        )
        print(f"   [OK] Added 2 flights")
        
        # Hotel
        hotel1_id = create_hotel(
            booking_id=booking1_id,
            hotel_name="Mara Serena Safari Lodge",
            address="Masai Mara National Reserve",
            city="Masai Mara",
            country="Kenya",
            phone="+254 20 2842000",
            email="reservations@serenahotels.com",
            check_in_date=(date.today() + timedelta(days=31)).isoformat(),
            check_out_date=(date.today() + timedelta(days=36)).isoformat(),
            room_type="Luxury Tent with View",
            price=2850.00,
            currency="USD"
        )
        print(f"   [OK] Added hotel reservation")
        
        # Transfers
        transfer1_id = create_transfer(
            booking_id=booking1_id,
            scheduled_datetime=(datetime.now() + timedelta(days=31)).replace(hour=8, minute=0).isoformat(),
            from_location="Jomo Kenyatta Airport",
            to_location="Wilson Airport",
            transfer_type="airport_pickup",
            vehicle_type="Toyota Land Cruiser",
            driver_name="James Mwangi",
            driver_phone="+254722123456",
            supplier_name="Safari Connections",
            price=85.00,
            currency="USD"
        )
        print(f"   [OK] Added transfer")
        
        # Activities
        activity1_id = create_activity(
            booking_id=booking1_id,
            activity_name="Morning Game Drive",
            scheduled_datetime=(datetime.now() + timedelta(days=32)).replace(hour=6, minute=0).isoformat(),
            location="Masai Mara National Reserve",
            supplier_name="Mara Serena Lodge",
            price=150.00,
            currency="USD"
        )
        
        activity2_id = create_activity(
            booking_id=booking1_id,
            activity_name="Hot Air Balloon Safari",
            scheduled_datetime=(datetime.now() + timedelta(days=33)).replace(hour=5, minute=30).isoformat(),
            location="Masai Mara",
            supplier_name="Governors Balloon Safaris",
            price=950.00,
            currency="USD"
        )
        print(f"   [OK] Added 2 activities")
    
    # ==================== BOOKING 2: Beach Holiday ====================
    print("\n2. Creating Mombasa Beach Holiday booking...")
    
    booking2_id = create_booking(
        organization_id=org_id,
        created_by=user_id,
        title="Mombasa Beach Holiday",
        start_date=(date.today() + timedelta(days=60)).isoformat(),
        end_date=(date.today() + timedelta(days=67)).isoformat(),
        status="confirmed",
        total_travelers=1,
        total_price=1200.00,
        currency="USD",
        notes="Relaxing beach vacation"
    )
    
    if booking2_id:
        print(f"   [OK] Booking created: {booking2_id}")
        
        # Traveler
        traveler3_id = create_traveler(
            organization_id=org_id,
            first_name="Sarah",
            last_name="Johnson",
            phone="+14155551234",
            email="sarah.johnson@example.com",
            phone_country_code="+1",
            date_of_birth="1990-05-10",
            passport_number="US987654",
            passport_expiry="2029-12-31",
            nationality="US"
        )
        
        link_traveler_to_booking(booking2_id, traveler3_id, is_primary=True)
        print(f"   [OK] Added traveler")
        
        # Flight
        flight3_id = create_flight(
            booking_id=booking2_id,
            carrier_code="KQ",
            flight_number="400",
            departure_date=(date.today() + timedelta(days=60)).isoformat(),
            departure_airport="NBO",
            arrival_airport="MBA",
            scheduled_departure=(datetime.now() + timedelta(days=60)).replace(hour=10, minute=0).isoformat(),
            scheduled_arrival=(datetime.now() + timedelta(days=60)).replace(hour=11, minute=15).isoformat(),
            flight_type="outbound",
            airline_name="Kenya Airways",
            status="scheduled"
        )
        print(f"   [OK] Added flight")
        
        # Hotel
        hotel2_id = create_hotel(
            booking_id=booking2_id,
            hotel_name="Sarova Whitesands Beach Resort",
            address="Mombasa Beach",
            city="Mombasa",
            country="Kenya",
            check_in_date=(date.today() + timedelta(days=60)).isoformat(),
            check_out_date=(date.today() + timedelta(days=67)).isoformat(),
            room_type="Ocean View Room",
            price=1200.00,
            currency="USD"
        )
        print(f"   [OK] Added hotel reservation")
    
    # ==================== BOOKING 3: Mountain Climbing ====================
    print("\n3. Creating Mount Kenya Climbing booking...")
    
    booking3_id = create_booking(
        organization_id=org_id,
        created_by=user_id,
        title="Mount Kenya Climbing Expedition",
        start_date=(date.today() + timedelta(days=90)).isoformat(),
        end_date=(date.today() + timedelta(days=95)).isoformat(),
        status="draft",
        total_travelers=4,
        total_price=3200.00,
        currency="USD",
        notes="5-day climbing expedition"
    )
    
    if booking3_id:
        print(f"   [OK] Booking created: {booking3_id}")
        
        # Travelers
        for i, name in enumerate([("Michael", "Brown"), ("David", "Wilson"), ("Emma", "Davis"), ("Lisa", "Miller")], 1):
            traveler_id = create_traveler(
                organization_id=org_id,
                first_name=name[0],
                last_name=name[1],
                phone=f"+1415555{1000+i}",
                email=f"{name[0].lower()}.{name[1].lower()}@example.com",
                phone_country_code="+1",
                nationality="US"
            )
            link_traveler_to_booking(booking3_id, traveler_id, is_primary=(i == 1))
        
        print(f"   [OK] Added 4 travelers")
        
        # Activity
        activity3_id = create_activity(
            booking_id=booking3_id,
            activity_name="Mount Kenya Summit Climb",
            scheduled_datetime=(datetime.now() + timedelta(days=92)).replace(hour=4, minute=0).isoformat(),
            location="Mount Kenya National Park",
            supplier_name="Kenya Mountain Guides",
            price=800.00,
            currency="USD"
        )
        print(f"   [OK] Added activity")
    
    # Summary
    print("\n" + "=" * 60)
    print("  [OK] Test Data Seeding Complete!")
    print("=" * 60)
    print(f"\nSummary:")
    print(f"   User: {user_name}")
    print(f"   Email: {user_email}")
    print(f"   Password: {user_password}")
    print(f"   Organization: {org_name}")
    
    # Count created items
    bookings = get_bookings_by_organization(org_id)
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM travelers WHERE organization_id = ?", (org_id,))
    traveler_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM flights WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)", (org_id,))
    flight_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM hotels WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)", (org_id,))
    hotel_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM transfers WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)", (org_id,))
    transfer_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM activities WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)", (org_id,))
    activity_count = cursor.fetchone()[0]
    
    conn.close()
    
    print(f"\nCreated Data:")
    print(f"   Bookings: {len(bookings)}")
    print(f"   Travelers: {traveler_count}")
    print(f"   Flights: {flight_count}")
    print(f"   Hotels: {hotel_count}")
    print(f"   Transfers: {transfer_count}")
    print(f"   Activities: {activity_count}")
    print("\n[OK] You can now login with:")
    print(f"   Email: {user_email}")
    print(f"   Password: {user_password}")
    print()


if __name__ == "__main__":
    seed_test_data()

