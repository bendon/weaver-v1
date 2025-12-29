#!/usr/bin/env python3
"""
ItineraryWeaver PoC - Complete Demo Script

This script demonstrates the full flow:
1. Connect to Amadeus API (test environment)
2. Search for flights
3. Create a booking (simulated PNR)
4. Compile into a branded itinerary
5. Generate WhatsApp message and HTML output

Run: python -m app.demo
"""

import os
import sys
from datetime import datetime, date, timedelta
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.amadeus_client import AmadeusClient
from app.models import (
    Traveler, TravelerContact, NotificationChannel,
    FlightBooking, FlightSegment, Airport, BookingStatus,
    HotelReservation, HotelProperty,
    Transfer, TransferType,
    Activity,
    ItineraryBranding
)
from app.itinerary_compiler import ItineraryCompiler, ItineraryFormatter


def create_sample_booking():
    """Create a sample Kenya safari booking for demonstration"""
    
    # ==================== TRAVELERS ====================
    travelers = [
        Traveler(
            id="PAX1",
            first_name="John",
            last_name="Smith",
            date_of_birth=date(1985, 3, 15),
            passport_number="AB123456",
            passport_expiry=date(2028, 6, 1),
            nationality="GB",
            contact=TravelerContact(
                email="john.smith@email.com",
                phone="+447700900123",
                whatsapp="+447700900123",
                preferred_channel=NotificationChannel.WHATSAPP
            )
        ),
        Traveler(
            id="PAX2",
            first_name="Jane",
            last_name="Smith",
            date_of_birth=date(1987, 7, 22),
            passport_number="CD789012",
            passport_expiry=date(2027, 9, 15),
            nationality="GB",
            contact=TravelerContact(
                email="jane.smith@email.com",
                phone="+447700900124",
                whatsapp="+447700900124"
            )
        )
    ]
    
    # ==================== FLIGHTS ====================
    # Outbound: London → Nairobi
    outbound_segments = [
        FlightSegment(
            segment_id="SEG1",
            carrier_code="KQ",
            carrier_name="Kenya Airways",
            flight_number="101",
            aircraft_type="Boeing 787-8",
            departure_airport=Airport(
                iata_code="LHR",
                name="London Heathrow",
                city="London",
                country="United Kingdom",
                terminal="4"
            ),
            departure_datetime=datetime(2025, 2, 15, 21, 45),
            arrival_airport=Airport(
                iata_code="NBO",
                name="Jomo Kenyatta International",
                city="Nairobi",
                country="Kenya",
                terminal="1A"
            ),
            arrival_datetime=datetime(2025, 2, 16, 7, 30),
            duration="PT8H45M",
            cabin_class="BUSINESS",
            status=BookingStatus.CONFIRMED
        )
    ]
    
    # Nairobi → Masai Mara
    safari_flight = FlightSegment(
        segment_id="SEG2",
        carrier_code="5Y",
        carrier_name="SafariLink",
        flight_number="501",
        aircraft_type="Cessna Grand Caravan",
        departure_airport=Airport(
            iata_code="WIL",
            name="Wilson Airport",
            city="Nairobi",
            country="Kenya"
        ),
        departure_datetime=datetime(2025, 2, 16, 10, 30),
        arrival_airport=Airport(
            iata_code="MRE",
            name="Mara Serena Airstrip",
            city="Masai Mara",
            country="Kenya"
        ),
        arrival_datetime=datetime(2025, 2, 16, 11, 45),
        duration="PT1H15M",
        cabin_class="ECONOMY",
        status=BookingStatus.CONFIRMED
    )
    
    # Return: Masai Mara → Nairobi → London
    return_segments = [
        FlightSegment(
            segment_id="SEG3",
            carrier_code="5Y",
            carrier_name="SafariLink",
            flight_number="502",
            departure_airport=Airport(
                iata_code="MRE",
                name="Mara Serena Airstrip",
                city="Masai Mara",
                country="Kenya"
            ),
            departure_datetime=datetime(2025, 2, 19, 15, 0),
            arrival_airport=Airport(
                iata_code="WIL",
                name="Wilson Airport",
                city="Nairobi",
                country="Kenya"
            ),
            arrival_datetime=datetime(2025, 2, 19, 16, 15),
            duration="PT1H15M",
            cabin_class="ECONOMY",
            status=BookingStatus.CONFIRMED
        ),
        FlightSegment(
            segment_id="SEG4",
            carrier_code="KQ",
            carrier_name="Kenya Airways",
            flight_number="100",
            aircraft_type="Boeing 787-8",
            departure_airport=Airport(
                iata_code="NBO",
                name="Jomo Kenyatta International",
                city="Nairobi",
                country="Kenya",
                terminal="1A"
            ),
            departure_datetime=datetime(2025, 2, 19, 23, 55),
            arrival_airport=Airport(
                iata_code="LHR",
                name="London Heathrow",
                city="London",
                country="United Kingdom",
                terminal="4"
            ),
            arrival_datetime=datetime(2025, 2, 20, 5, 45),
            duration="PT8H50M",
            cabin_class="BUSINESS",
            status=BookingStatus.CONFIRMED
        )
    ]
    
    flights = [
        FlightBooking(
            booking_id="FB001",
            pnr="ABC123",
            segments=outbound_segments,
            travelers=["PAX1", "PAX2"],
            total_price=4850.00,
            currency="GBP",
            booking_date=datetime.now(),
            source_gds="AMADEUS"
        ),
        FlightBooking(
            booking_id="FB002",
            pnr="DEF456",
            segments=[safari_flight],
            travelers=["PAX1", "PAX2"],
            total_price=450.00,
            currency="USD",
            booking_date=datetime.now(),
            source_gds="DIRECT"
        ),
        FlightBooking(
            booking_id="FB003",
            pnr="GHI789",
            segments=return_segments,
            travelers=["PAX1", "PAX2"],
            total_price=500.00,
            currency="USD",
            booking_date=datetime.now(),
            source_gds="DIRECT"
        )
    ]
    
    # ==================== HOTELS ====================
    hotels = [
        HotelReservation(
            booking_id="HT001",
            confirmation_number="MARA-78542",
            hotel=HotelProperty(
                hotel_id="MARA001",
                name="Mara Serena Safari Lodge",
                chain_name="Serena Hotels",
                address="Masai Mara National Reserve",
                city="Masai Mara",
                country="Kenya",
                phone="+254 20 2842000",
                email="reservations@serenahotels.com",
                star_rating=5,
                amenities=["Pool", "Spa", "Restaurant", "WiFi", "Game Drives"]
            ),
            check_in_date=date(2025, 2, 16),
            check_out_date=date(2025, 2, 19),
            room_type="Luxury Tent with View",
            room_count=1,
            guests=["PAX1", "PAX2"],
            total_price=2850.00,
            currency="USD",
            meal_plan="FB",  # Full Board
            special_requests=["Honeymoon setup", "Quiet location"],
            status=BookingStatus.CONFIRMED
        )
    ]
    
    # ==================== TRANSFERS ====================
    transfers = [
        Transfer(
            booking_id="TR001",
            confirmation_number="TRF-1234",
            transfer_type=TransferType.PRIVATE,
            pickup_location="Jomo Kenyatta Airport",
            pickup_datetime=datetime(2025, 2, 16, 7, 45),
            pickup_address="Arrivals Terminal 1A",
            dropoff_location="Wilson Airport",
            dropoff_address="Domestic Terminal",
            vehicle_type="Toyota Land Cruiser",
            provider_name="Safari Connections",
            driver_name="James Mwangi",
            driver_phone="+254 722 123456",
            passengers=["PAX1", "PAX2"],
            total_price=85.00,
            currency="USD",
            status=BookingStatus.CONFIRMED
        ),
        Transfer(
            booking_id="TR002",
            confirmation_number="TRF-1235",
            transfer_type=TransferType.PRIVATE,
            pickup_location="Mara Serena Airstrip",
            pickup_datetime=datetime(2025, 2, 16, 11, 50),
            dropoff_location="Mara Serena Safari Lodge",
            vehicle_type="Safari Vehicle",
            provider_name="Lodge Transfer",
            passengers=["PAX1", "PAX2"],
            status=BookingStatus.CONFIRMED
        )
    ]
    
    # ==================== ACTIVITIES ====================
    activities = [
        Activity(
            booking_id="ACT001",
            confirmation_number="GD-2025-001",
            name="Morning Game Drive",
            description="Early morning safari to spot the Big Five. Best time to see predators hunting.",
            activity_date=date(2025, 2, 17),
            start_time=datetime.strptime("06:00", "%H:%M").time(),
            end_time=datetime.strptime("10:00", "%H:%M").time(),
            duration="PT4H",
            location="Masai Mara National Reserve",
            meeting_point="Lodge Reception",
            provider_name="Mara Serena Lodge",
            participants=["PAX1", "PAX2"],
            inclusions=["Expert guide", "Refreshments", "Binoculars"],
            what_to_bring=["Camera", "Warm layers", "Sunscreen"],
            status=BookingStatus.CONFIRMED
        ),
        Activity(
            booking_id="ACT002",
            confirmation_number="GD-2025-002",
            name="Sunset Game Drive",
            description="Evening safari with sundowner drinks overlooking the savannah.",
            activity_date=date(2025, 2, 17),
            start_time=datetime.strptime("16:00", "%H:%M").time(),
            end_time=datetime.strptime("19:00", "%H:%M").time(),
            duration="PT3H",
            location="Masai Mara National Reserve",
            meeting_point="Lodge Reception",
            provider_name="Mara Serena Lodge",
            participants=["PAX1", "PAX2"],
            inclusions=["Expert guide", "Sundowner drinks", "Snacks"],
            status=BookingStatus.CONFIRMED
        ),
        Activity(
            booking_id="ACT003",
            confirmation_number="BB-2025-001",
            name="Hot Air Balloon Safari",
            description="Float above the Mara at sunrise for breathtaking views of wildlife below.",
            activity_date=date(2025, 2, 18),
            start_time=datetime.strptime("05:30", "%H:%M").time(),
            duration="PT3H",
            location="Masai Mara",
            meeting_point="Balloon Launch Site (pickup from lodge at 05:00)",
            provider_name="Governors Balloon Safaris",
            provider_phone="+254 20 2734000",
            participants=["PAX1", "PAX2"],
            total_price=950.00,
            currency="USD",
            inclusions=["Balloon flight", "Bush breakfast", "Champagne toast", "Certificate"],
            what_to_bring=["Warm clothing", "Camera"],
            status=BookingStatus.CONFIRMED
        ),
        Activity(
            booking_id="ACT004",
            name="Full Day Game Drive",
            activity_date=date(2025, 2, 18),
            start_time=datetime.strptime("14:00", "%H:%M").time(),
            duration="PT5H",
            location="Masai Mara National Reserve",
            meeting_point="Lodge Reception",
            participants=["PAX1", "PAX2"],
            status=BookingStatus.CONFIRMED
        )
    ]
    
    return travelers, flights, hotels, transfers, activities


def run_demo():
    """Run the complete PoC demonstration"""
    
    print("=" * 60)
    print("  ItineraryWeaver PoC - Kenya Safari Demo")
    print("=" * 60)
    print()
    
    # Get sample data
    travelers, flights, hotels, transfers, activities = create_sample_booking()
    
    print("[OK] Created sample booking data:")
    print(f"   - {len(travelers)} travelers")
    print(f"   - {len(flights)} flight bookings ({sum(len(f.segments) for f in flights)} segments)")
    print(f"   - {len(hotels)} hotel reservations")
    print(f"   - {len(transfers)} transfers")
    print(f"   - {len(activities)} activities")
    print()
    
    # Create branding
    branding = ItineraryBranding(
        company_name="Safari Dreams Kenya",
        primary_color="#2E7D32",  # Safari green
        secondary_color="#FFF8E1",
        contact_phone="+254 722 555 123",
        contact_email="info@safaridreams.ke",
        contact_whatsapp="+254 722 555 123",
        website="www.safaridreams.ke",
        footer_text="Creating unforgettable African adventures since 2010"
    )
    
    # Compile itinerary
    print("[*] Compiling itinerary...")
    compiler = ItineraryCompiler(branding=branding)
    
    itinerary = compiler.compile(
        reference_number="SDK-2025-0042",
        title="Kenya Safari Adventure",
        description="A luxurious 4-night safari experience in the Masai Mara",
        travelers=travelers,
        flights=flights,
        hotels=hotels,
        transfers=transfers,
        activities=activities
    )
    
    print(f"[OK] Itinerary compiled successfully!")
    print(f"   - ID: {itinerary.itinerary_id}")
    print(f"   - Reference: {itinerary.reference_number}")
    print(f"   - Duration: {itinerary.duration_nights} nights")
    print(f"   - Days: {len(itinerary.days)}")
    print(f"   - Hash: {itinerary.last_change_hash[:16]}...")
    print()
    
    # Generate outputs
    print("[*] Generating outputs...")
    
    # WhatsApp message
    whatsapp_msg = ItineraryFormatter.to_whatsapp_message(itinerary)
    print("\n" + "=" * 60)
    print("  WHATSAPP MESSAGE PREVIEW")
    print("=" * 60)
    try:
        print(whatsapp_msg)
    except UnicodeEncodeError:
        # Windows console encoding issue - print without emojis
        print(whatsapp_msg.encode('ascii', 'ignore').decode('ascii'))
    print("=" * 60)
    
    # Save HTML
    html_content = ItineraryFormatter.to_html(itinerary)
    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)
    
    html_path = output_dir / "itinerary.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"\n[OK] HTML itinerary saved to: {html_path}")
    
    # Save JSON
    import json
    json_path = output_dir / "itinerary.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(ItineraryFormatter.to_json(itinerary), f, indent=2, default=str)
    print(f"[OK] JSON data saved to: {json_path}")
    
    # Save WhatsApp message
    wa_path = output_dir / "whatsapp_message.txt"
    with open(wa_path, "w", encoding="utf-8") as f:
        f.write(whatsapp_msg)
    print(f"[OK] WhatsApp message saved to: {wa_path}")
    
    print()
    print("=" * 60)
    print("  PoC COMPLETE")
    print("=" * 60)
    print()
    print("Next steps to test with Amadeus API:")
    print("1. Run: python -m app.demo --amadeus")
    print("2. This will test authentication and search flights")
    print("3. Then integrate real Amadeus data into the compiler")
    print()
    
    return itinerary


def test_amadeus_integration():
    """Test integration with Amadeus API"""
    
    print("=" * 60)
    print("  Testing Amadeus API Integration")
    print("=" * 60)
    print()
    
    # Load credentials from environment or .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    
    api_key = os.getenv("AMADEUS_API_KEY", "nUTezdBj1nF3SeH73KIQBtSAYWeAB9GG")
    api_secret = os.getenv("AMADEUS_API_SECRET", "qzIGjoszYuEv5mGU")
    
    print(f"API Key: {api_key[:10]}...")
    print(f"Environment: test")
    print()
    
    try:
        client = AmadeusClient(api_key=api_key, api_secret=api_secret)
        
        # Test authentication
        print("1. Testing authentication...")
        print(f"   Using API Key: {api_key[:15]}...{api_key[-5:]}")
        print(f"   API Secret length: {len(api_secret)} characters")
        token = client._get_token_sync()
        print(f"   [OK] Token obtained: {token[:20]}...")
        
        # Search flights
        print("\n2. Searching flights NBO -> MBA...")
        departure = (date.today() + timedelta(days=30)).isoformat()
        
        results = client.search_flights(
            origin="NBO",
            destination="MBA",  # Mombasa (Masai Mara has limited GDS coverage)
            departure_date=departure,
            adults=2,
            max_results=5
        )
        
        if results.get("data"):
            print(f"   [OK] Found {len(results['data'])} flight offers")
            for offer in results["data"][:3]:
                price = offer["price"]["total"]
                currency = offer["price"]["currency"]
                seg = offer["itineraries"][0]["segments"][0]
                print(f"      - {seg['carrierCode']}{seg['number']}: {currency} {price}")
        else:
            print("   [WARNING] No flights found")
        
        print("\n[OK] Amadeus integration test complete!")
        return True
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("\n" + "=" * 60)
        print("TROUBLESHOOTING:")
        print("=" * 60)
        print("The error 'Client credentials are invalid' means:")
        print("1. The API Key or Secret may be incorrect")
        print("2. The credentials may not be activated in your Amadeus account")
        print("3. You may be using production credentials for test environment")
        print()
        print("To fix this:")
        print("1. Go to: https://developers.amadeus.com/my-apps")
        print("2. Check your app status (should be 'Active')")
        print("3. Copy the correct API Key and Secret from your app")
        print("4. Update the .env file with the correct credentials")
        print("5. Wait a few minutes if you just created the app")
        print()
        print("Note: This test requires network access to test.api.amadeus.com")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ItineraryWeaver PoC Demo")
    parser.add_argument("--amadeus", action="store_true", help="Test Amadeus API integration")
    args = parser.parse_args()
    
    if args.amadeus:
        test_amadeus_integration()
    else:
        run_demo()

