# ItineraryWeaver API Examples

This document provides example requests for the ItineraryWeaver REST API.

## Base URL

```
http://localhost:8000
```

## Health Check

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "amadeus_connected": true
}
```

## Compile Itinerary

**POST** `/api/itineraries/compile`

Example request:

```json
{
  "reference_number": "SDK-2025-0042",
  "title": "Kenya Safari Adventure",
  "description": "A luxurious 4-night safari experience in the Masai Mara",
  "travelers": [
    {
      "id": "PAX1",
      "first_name": "John",
      "last_name": "Smith",
      "date_of_birth": "1985-03-15",
      "passport_number": "AB123456",
      "passport_expiry": "2028-06-01",
      "nationality": "GB",
      "contact": {
        "email": "john.smith@email.com",
        "phone": "+447700900123",
        "whatsapp": "+447700900123",
        "preferred_channel": "whatsapp"
      }
    }
  ],
  "flights": [
    {
      "booking_id": "FB001",
      "pnr": "ABC123",
      "segments": [
        {
          "segment_id": "SEG1",
          "carrier_code": "KQ",
          "carrier_name": "Kenya Airways",
          "flight_number": "101",
          "aircraft_type": "Boeing 787-8",
          "departure_airport": {
            "iata_code": "LHR",
            "name": "London Heathrow",
            "city": "London",
            "country": "United Kingdom",
            "terminal": "4"
          },
          "departure_datetime": "2025-02-15T21:45:00",
          "arrival_airport": {
            "iata_code": "NBO",
            "name": "Jomo Kenyatta International",
            "city": "Nairobi",
            "country": "Kenya",
            "terminal": "1A"
          },
          "arrival_datetime": "2025-02-16T07:30:00",
          "duration": "PT8H45M",
          "cabin_class": "BUSINESS",
          "status": "confirmed"
        }
      ],
      "travelers": ["PAX1"],
      "total_price": 4850.00,
      "currency": "GBP",
      "source_gds": "AMADEUS"
    }
  ],
  "hotels": [
    {
      "booking_id": "HT001",
      "confirmation_number": "MARA-78542",
      "hotel": {
        "hotel_id": "MARA001",
        "name": "Mara Serena Safari Lodge",
        "chain_name": "Serena Hotels",
        "address": "Masai Mara National Reserve",
        "city": "Masai Mara",
        "country": "Kenya",
        "phone": "+254 20 2842000",
        "email": "reservations@serenahotels.com",
        "star_rating": 5,
        "amenities": ["Pool", "Spa", "Restaurant", "WiFi", "Game Drives"]
      },
      "check_in_date": "2025-02-16",
      "check_out_date": "2025-02-19",
      "room_type": "Luxury Tent with View",
      "room_count": 1,
      "guests": ["PAX1"],
      "total_price": 2850.00,
      "currency": "USD",
      "meal_plan": "FB",
      "special_requests": ["Honeymoon setup", "Quiet location"],
      "status": "confirmed"
    }
  ],
  "transfers": [],
  "activities": [],
  "branding": {
    "company_name": "Safari Dreams Kenya",
    "primary_color": "#2E7D32",
    "secondary_color": "#FFF8E1",
    "contact_phone": "+254 722 555 123",
    "contact_email": "info@safaridreams.ke",
    "contact_whatsapp": "+254 722 555 123",
    "website": "www.safaridreams.ke",
    "footer_text": "Creating unforgettable African adventures since 2010"
  }
}
```

## Get Itinerary Format

**POST** `/api/itineraries/{itinerary_id}/format/{format_type}`

Where `format_type` can be: `whatsapp`, `html`, or `json`

Example:
```bash
curl -X POST "http://localhost:8000/api/itineraries/ITIN-001/format/whatsapp" \
  -H "Content-Type: application/json" \
  -d @itinerary_request.json
```

## Search Flights

**POST** `/api/flights/search`

Example request:

```json
{
  "origin": "NBO",
  "destination": "MBA",
  "departure_date": "2025-03-15",
  "return_date": "2025-03-22",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "max_results": 5
}
```

Example response:
```json
{
  "success": true,
  "data": [
    {
      "type": "flight-offer",
      "id": "1",
      "source": "GDS",
      "itineraries": [...],
      "price": {
        "currency": "EUR",
        "total": "130.30"
      }
    }
  ],
  "meta": {
    "count": 5
  }
}
```

## Test Amadeus Connection

**GET** `/api/amadeus/test`

```bash
curl http://localhost:8000/api/amadeus/test
```

Response:
```json
{
  "success": true,
  "message": "Amadeus API connection successful",
  "token_preview": "m4ZN3sYANDRVoBl2Ncj7..."
}
```

## JavaScript/Fetch Examples

### Compile Itinerary

```javascript
const response = await fetch('http://localhost:8000/api/itineraries/compile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reference_number: 'BOOK-001',
    title: 'My Trip',
    travelers: [...],
    flights: [...],
    hotels: [...]
  })
});

const itinerary = await response.json();
console.log(itinerary);
```

### Search Flights

```javascript
const response = await fetch('http://localhost:8000/api/flights/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    origin: 'NBO',
    destination: 'MBA',
    departure_date: '2025-03-15',
    adults: 2,
    max_results: 5
  })
});

const results = await response.json();
console.log(results.data);
```

### Get WhatsApp Format

```javascript
const response = await fetch('http://localhost:8000/api/itineraries/ITIN-001/format/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(itineraryRequest)
});

const format = await response.json();
console.log(format.content); // WhatsApp message text
```

## Python Requests Examples

```python
import requests

BASE_URL = "http://localhost:8000"

# Compile itinerary
response = requests.post(
    f"{BASE_URL}/api/itineraries/compile",
    json={
        "reference_number": "BOOK-001",
        "title": "My Trip",
        "travelers": [...],
        "flights": [...]
    }
)
itinerary = response.json()

# Search flights
response = requests.post(
    f"{BASE_URL}/api/flights/search",
    json={
        "origin": "NBO",
        "destination": "MBA",
        "departure_date": "2025-03-15",
        "adults": 2
    }
)
flights = response.json()
```

