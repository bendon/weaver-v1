# ItineraryWeaver API Endpoints

Complete list of available API endpoints.

## Base URL
```
http://localhost:8000
```

## Endpoints

### Health & Status

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "amadeus_connected": true
}
```

#### `GET /`
Same as `/health`.

---

### Itineraries

#### `GET /api/itineraries`
Get all stored itineraries.

**Response:**
```json
[
  {
    "itinerary_id": "ITIN-SDK-2025-0042",
    "reference_number": "SDK-2025-0042",
    "title": "Kenya Safari Adventure",
    ...
  }
]
```

#### `GET /api/itineraries/{itinerary_id}`
Get a specific itinerary by ID.

**Parameters:**
- `itinerary_id` (path): The itinerary ID (e.g., "ITIN-SDK-2025-0042")

**Response:**
```json
{
  "itinerary_id": "ITIN-SDK-2025-0042",
  "reference_number": "SDK-2025-0042",
  "title": "Kenya Safari Adventure",
  "description": "...",
  "travelers": [...],
  "flights": [...],
  "hotels": [...],
  "transfers": [...],
  "activities": [...],
  "days": [...],
  ...
}
```

**Errors:**
- `404`: Itinerary not found

#### `DELETE /api/itineraries/{itinerary_id}`
Delete an itinerary by ID.

**Parameters:**
- `itinerary_id` (path): The itinerary ID

**Response:**
```json
{
  "success": true,
  "message": "Itinerary ITIN-SDK-2025-0042 deleted"
}
```

**Errors:**
- `404`: Itinerary not found
- `500`: Failed to delete itinerary

#### `POST /api/itineraries/compile`
Compile travel components into a structured itinerary and store it.

**Request Body:** `CompileItineraryRequest`
```json
{
  "reference_number": "BOOK-001",
  "title": "My Trip",
  "description": "Trip description",
  "travelers": [...],
  "flights": [...],
  "hotels": [...],
  "transfers": [...],
  "activities": [...],
  "branding": {...}
}
```

**Response:** `ItineraryResponse`
```json
{
  "itinerary_id": "ITIN-BOOK-001",
  "reference_number": "BOOK-001",
  ...
}
```

#### `POST /api/itineraries/{itinerary_id}/format/{format_type}`
Get itinerary in a specific format.

**Parameters:**
- `itinerary_id` (path): The itinerary ID
- `format_type` (path): One of `whatsapp`, `html`, or `json`

**Request Body:** `CompileItineraryRequest` (same as compile endpoint)

**Response:**
```json
{
  "content": "...",
  "format": "whatsapp"
}
```

---

### Flights

#### `POST /api/flights/search`
Search for flights using Amadeus API.

**Request Body:** `FlightSearchRequest`
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

**Response:** `FlightSearchResponse`
```json
{
  "success": true,
  "data": [...],
  "meta": {...}
}
```

#### `POST /api/flights/convert-amadeus-offer`
Convert an Amadeus flight offer to a FlightBooking format for use in itineraries.

This endpoint takes an Amadeus flight offer (from search results) and converts it into the internal FlightBooking format that can be used when compiling itineraries.

**Request Body:** `ConvertAmadeusOfferRequest`
```json
{
  "offer": {
    "type": "flight-offer",
    "id": "1",
    "source": "GDS",
    "itineraries": [...],
    "price": {
      "currency": "EUR",
      "total": "130.30"
    }
  },
  "booking_id": "FB001",
  "pnr": "ABC123",
  "traveler_ids": ["PAX1", "PAX2"],
  "source_gds": "AMADEUS"
}
```

**Response:** `ConvertAmadeusOfferResponse`
```json
{
  "success": true,
  "flight_booking": {
    "booking_id": "FB001",
    "pnr": "ABC123",
    "segments": [...],
    "travelers": ["PAX1", "PAX2"],
    "total_price": 130.30,
    "currency": "EUR",
    "source_gds": "AMADEUS"
  }
}
```

**Usage Flow:**
1. Search for flights using `/api/flights/search`
2. Select a flight offer from the results
3. Convert it using `/api/flights/convert-amadeus-offer`
4. Use the converted `flight_booking` in `/api/itineraries/compile`

#### `POST /api/flights/price-offer`
Price a flight offer to get confirmed pricing before booking.

**Request Body:** `PriceFlightOfferRequest`
```json
{
  "flight_offer": {
    "type": "flight-offer",
    "id": "1",
    "itineraries": [...],
    "price": {...}
  }
}
```

**Response:** `PriceFlightOfferResponse`
```json
{
  "success": true,
  "priced_offer": {
    "type": "flight-offer",
    "id": "1",
    "itineraries": [...],
    "price": {
      "currency": "EUR",
      "total": "130.30"
    }
  }
}
```

#### `POST /api/flights/create-booking`
Create an actual flight booking with Amadeus.

**Request Body:** `CreateAmadeusBookingRequest`
```json
{
  "flight_offer": {
    // Priced flight offer from /api/flights/price-offer
  },
  "travelers": [
    {
      "id": "1",
      "dateOfBirth": "1985-03-15",
      "name": {
        "firstName": "JOHN",
        "lastName": "SMITH"
      },
      "gender": "MALE",
      "contact": {
        "emailAddress": "john.smith@email.com",
        "phones": [{
          "deviceType": "MOBILE",
          "countryCallingCode": "44",
          "number": "7700900123"
        }]
      },
      "documents": [{
        "documentType": "PASSPORT",
        "number": "AB123456",
        "expiryDate": "2028-06-01",
        "issuanceCountry": "GB",
        "validityCountry": "GB",
        "nationality": "GB",
        "holder": true
      }]
    }
  ],
  "contacts": [{
    "addresseeName": {
      "firstName": "JOHN",
      "lastName": "SMITH"
    },
    "companyName": "Travel Agency",
    "purpose": "STANDARD",
    "phones": [...],
    "emailAddress": "contact@agency.com"
  }]
}
```

**Response:** `AmadeusBookingResponse`
```json
{
  "success": true,
  "order_id": "eJzTd9f3NjIwMDI2NTAyNjI0NjQyNjQy0A8B9wkFAg==",
  "pnr": "ABC123",
  "booking_data": {
    "type": "flight-order",
    "id": "eJzTd9f3NjIwMDI2NTAyNjI0NjQyNjQy0A8B9wkFAg==",
    "associatedRecords": [{
      "reference": "ABC123",
      "creationDate": "2025-01-15"
    }]
  }
}
```

#### `GET /api/flights/booking/{order_id}`
Get flight booking details by Amadeus order ID.

**Parameters:**
- `order_id` (path): Amadeus order ID

**Response:** `AmadeusBookingResponse`
```json
{
  "success": true,
  "order_id": "eJzTd9f3NjIwMDI2NTAyNjI0NjQyNjQy0A8B9wkFAg==",
  "pnr": "ABC123",
  "booking_data": {...}
}
```

#### `GET /api/flights/booking/pnr/{pnr}`
Get flight booking by PNR/confirmation number.

**Parameters:**
- `pnr` (path): PNR/confirmation number

**Response:** `AmadeusBookingResponse`

#### `POST /api/flights/booking/{order_id}/sync`
Sync booking status from Amadeus (refresh booking data).

**Parameters:**
- `order_id` (path): Amadeus order ID

**Response:** `AmadeusBookingResponse`

#### `DELETE /api/flights/booking/{order_id}`
Cancel a flight booking by Amadeus order ID.

**Parameters:**
- `order_id` (path): Amadeus order ID

**Response:** `AmadeusBookingResponse`
```json
{
  "success": true,
  "order_id": "eJzTd9f3NjIwMDI2NTAyNjI0NjQyNjQy0A8B9wkFAg==",
  "booking_data": {
    "type": "flight-order",
    "id": "...",
    "status": "CANCELLED"
  }
}
```

**Complete Booking Workflow:**
1. Search flights: `POST /api/flights/search`
2. Price offer: `POST /api/flights/price-offer`
3. Create booking: `POST /api/flights/create-booking`
4. Get booking: `GET /api/flights/booking/{order_id}`
5. Sync status: `POST /api/flights/booking/{order_id}/sync`
6. Cancel if needed: `DELETE /api/flights/booking/{order_id}`

---

### Amadeus

#### `GET /api/amadeus/test`
Test Amadeus API connection.

**Response:**
```json
{
  "success": true,
  "message": "Amadeus API connection successful",
  "token_preview": "m4ZN3sYANDRVoBl2Ncj7..."
}
```

**Errors:**
- `503`: Amadeus API credentials not configured
- `500`: Connection failed

---

## Storage

Itineraries are stored in a **SQLite database** located at `data/itineraries.db`.

### Database Schema

The `itineraries` table contains:
- `itinerary_id` (TEXT, PRIMARY KEY)
- `reference_number` (TEXT, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `data_json` (TEXT, NOT NULL) - Full itinerary data as JSON
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Features

- **Persistent storage**: Data persists across server restarts
- **Automatic initialization**: Database is created automatically on first startup
- **Indexed lookups**: Indexes on `reference_number` and `created_at` for fast queries
- **JSON storage**: Full itinerary data stored as JSON for flexibility

### Database Location

The database file is created at:
```
data/itineraries.db
```

This directory is automatically created if it doesn't exist.

---

## Demo Itinerary

On server startup, a demo itinerary is automatically created:
- **ID:** `ITIN-SDK-2025-0042`
- **Reference:** `SDK-2025-0042`
- **Title:** "Kenya Safari Adventure"

This itinerary is available immediately via:
- `GET /api/itineraries` (will include it in the list)
- `GET /api/itineraries/ITIN-SDK-2025-0042` (direct access)

