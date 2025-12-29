# Amadeus API Integration Guide

This guide explains how to use the Amadeus API integration in ItineraryWeaver.

## Overview

The ItineraryWeaver API integrates with Amadeus for Developers to:
- Search for real flight offers
- Convert Amadeus flight offers into internal FlightBooking format
- Use real flight data when compiling itineraries

## Setup

1. **Get Amadeus API Credentials:**
   - Sign up at https://developers.amadeus.com/
   - Create a new app in the test environment
   - Copy your API Key and API Secret

2. **Configure Credentials:**
   - Add to `.env` file:
     ```
     AMADEUS_API_KEY=your_api_key
     AMADEUS_API_SECRET=your_api_secret
     AMADEUS_ENVIRONMENT=test
     ```

3. **Test Connection:**
   ```bash
   curl http://localhost:8000/api/amadeus/test
   ```

## API Endpoints

### 1. Search Flights

**Endpoint:** `POST /api/flights/search`

Search for flights using Amadeus API.

**Request:**
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

**Response:**
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

### 2. Convert Amadeus Offer

**Endpoint:** `POST /api/flights/convert-amadeus-offer`

Convert an Amadeus flight offer to a FlightBooking format.

**Request:**
```json
{
  "offer": {
    // Amadeus flight offer from search results
    "type": "flight-offer",
    "id": "1",
    "itineraries": [...],
    "price": {...}
  },
  "booking_id": "FB001",
  "pnr": "ABC123",
  "traveler_ids": ["PAX1", "PAX2"],
  "source_gds": "AMADEUS"
}
```

**Response:**
```json
{
  "success": true,
  "flight_booking": {
    "booking_id": "FB001",
    "pnr": "ABC123",
    "segments": [
      {
        "segment_id": "SEG1",
        "carrier_code": "KQ",
        "carrier_name": "Kenya Airways",
        "flight_number": "624",
        "departure_airport": {...},
        "arrival_airport": {...},
        "departure_datetime": "2025-03-15T10:00:00",
        "arrival_datetime": "2025-03-15T11:30:00",
        "cabin_class": "ECONOMY",
        "status": "confirmed"
      }
    ],
    "travelers": ["PAX1", "PAX2"],
    "total_price": 130.30,
    "currency": "EUR",
    "source_gds": "AMADEUS"
  }
}
```

### 3. Compile Itinerary with Amadeus Flights

**Endpoint:** `POST /api/itineraries/compile`

Use the converted flight booking in your itinerary compilation.

**Request:**
```json
{
  "reference_number": "BOOK-001",
  "title": "My Trip",
  "travelers": [...],
  "flights": [
    {
      // Use the flight_booking from convert-amadeus-offer response
      "booking_id": "FB001",
      "pnr": "ABC123",
      "segments": [...],
      "travelers": ["PAX1", "PAX2"],
      "total_price": 130.30,
      "currency": "EUR",
      "source_gds": "AMADEUS"
    }
  ],
  "hotels": [...],
  "transfers": [...],
  "activities": [...]
}
```

## Complete Workflow Example

### Step 1: Search for Flights
```bash
curl -X POST "http://localhost:8000/api/flights/search" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "NBO",
    "destination": "MBA",
    "departure_date": "2025-03-15",
    "adults": 2,
    "max_results": 5
  }'
```

### Step 2: Select and Convert an Offer
```bash
curl -X POST "http://localhost:8000/api/flights/convert-amadeus-offer" \
  -H "Content-Type: application/json" \
  -d '{
    "offer": {
      // Copy the offer object from search results
    },
    "booking_id": "FB001",
    "pnr": "ABC123",
    "traveler_ids": ["PAX1", "PAX2"]
  }'
```

### Step 3: Compile Itinerary
```bash
curl -X POST "http://localhost:8000/api/itineraries/compile" \
  -H "Content-Type: application/json" \
  -d '{
    "reference_number": "BOOK-001",
    "title": "My Trip",
    "travelers": [...],
    "flights": [
      // Use the flight_booking from step 2
    ],
    "hotels": [...]
  }'
```

## JavaScript/Frontend Example

```javascript
// 1. Search for flights
const searchResponse = await fetch('http://localhost:8000/api/flights/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    origin: 'NBO',
    destination: 'MBA',
    departure_date: '2025-03-15',
    adults: 2,
    max_results: 5
  })
});

const searchResults = await searchResponse.json();

// 2. User selects a flight offer
const selectedOffer = searchResults.data[0];

// 3. Convert to FlightBooking
const convertResponse = await fetch('http://localhost:8000/api/flights/convert-amadeus-offer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    offer: selectedOffer,
    booking_id: 'FB001',
    pnr: 'ABC123',
    traveler_ids: ['PAX1', 'PAX2']
  })
});

const converted = await convertResponse.json();

// 4. Use in itinerary compilation
const itineraryResponse = await fetch('http://localhost:8000/api/itineraries/compile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reference_number: 'BOOK-001',
    title: 'My Trip',
    travelers: [...],
    flights: [converted.flight_booking],
    hotels: [...]
  })
});
```

## Data Conversion

The `convert_amadeus_flight_offer` function automatically:
- Extracts flight segments from Amadeus itineraries
- Converts airport codes to Airport objects
- Parses datetime strings
- Extracts pricing information
- Maps cabin classes
- Creates FlightSegment and FlightBooking objects

## Supported Features

✅ Flight search (one-way and round-trip)
✅ Multiple passengers (adults, children, infants)
✅ Cabin class selection
✅ Price information
✅ Flight segments with connections
✅ Airport information
✅ Datetime parsing

## Limitations

- **Test Environment Only**: Currently configured for Amadeus test environment
- **Airport Lookups**: Limited airport name/city/country mappings (can be expanded)
- **Carrier Names**: Limited airline name mappings (can be expanded)
- **No Booking**: This integration only searches and converts offers; actual booking requires additional Amadeus APIs

## Future Enhancements

- [ ] Hotel search integration
- [ ] Car rental search
- [ ] Airport information lookup from Amadeus
- [ ] Airline name lookup from Amadeus
- [ ] Actual flight booking (Order Management API)
- [ ] Price confirmation before booking

## Troubleshooting

### "Amadeus API credentials not configured"
- Check `.env` file has `AMADEUS_API_KEY` and `AMADEUS_API_SECRET`
- Verify credentials are correct
- Ensure app is active in Amadeus developer portal

### "Authentication failed"
- Verify API Key and Secret are correct
- Check app status in Amadeus portal
- Wait a few minutes after creating a new app

### "No flights found"
- Try different airport codes
- Check date is in the future
- Verify airport codes are valid IATA codes

