# Amadeus Booking Operations Guide

Complete guide for creating, managing, and updating flight bookings with Amadeus.

## Overview

The ItineraryWeaver API provides full CRUD operations for Amadeus flight bookings:
- ✅ **Create** - Book flights with traveler details
- ✅ **Read** - Get booking status and details
- ✅ **Update** - Sync booking status from Amadeus
- ✅ **Delete** - Cancel bookings

## Complete Booking Workflow

### Step 1: Search for Flights

```bash
POST /api/flights/search
```

```json
{
  "origin": "NBO",
  "destination": "MBA",
  "departure_date": "2025-03-15",
  "adults": 2,
  "max_results": 5
}
```

### Step 2: Price the Flight Offer

Before booking, you must price the offer to get confirmed pricing:

```bash
POST /api/flights/price-offer
```

```json
{
  "flight_offer": {
    // Flight offer from search results
  }
}
```

**Response:**
```json
{
  "success": true,
  "priced_offer": {
    "type": "flight-offer",
    "id": "1",
    "price": {
      "currency": "EUR",
      "total": "130.30"
    }
  }
}
```

### Step 3: Create the Booking

Use the priced offer to create an actual booking:

```bash
POST /api/flights/create-booking
```

**Request:**
```json
{
  "flight_offer": {
    // Use the priced_offer from step 2
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
        "holder": true,
        "birthPlace": "London",
        "issuanceLocation": "London",
        "issuanceDate": "2015-01-01"
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
    "phones": [{
      "deviceType": "MOBILE",
      "countryCallingCode": "44",
      "number": "7700900123"
    }],
    "emailAddress": "contact@agency.com",
    "address": {
      "lines": ["123 Main St"],
      "postalCode": "SW1A 1AA",
      "cityName": "London",
      "countryCode": "GB"
    }
  }],
  "remarks": {
    "general": [{
      "subType": "GENERAL_MISCELLANEOUS",
      "text": "Online booking"
    }]
  },
  "ticketingAgreement": {
    "option": "DELAY_TO_CANCEL",
    "delay": "6D"
  }
}
```

**Response:**
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
    }],
    "flightOffers": [...],
    "travelers": [...]
  }
}
```

### Step 4: Get Booking Status

Retrieve booking details at any time:

```bash
GET /api/flights/booking/{order_id}
```

Or by PNR:
```bash
GET /api/flights/booking/pnr/{pnr}
```

### Step 5: Sync Booking Status

Refresh booking data from Amadeus:

```bash
POST /api/flights/booking/{order_id}/sync
```

### Step 6: Cancel Booking (if needed)

```bash
DELETE /api/flights/booking/{order_id}
```

## JavaScript/Frontend Example

```javascript
// 1. Search for flights
const searchResult = await api.searchFlights({
  origin: 'NBO',
  destination: 'MBA',
  departure_date: '2025-03-15',
  adults: 2
});

// 2. User selects a flight
const selectedOffer = searchResult.data[0];

// 3. Price the offer
const priceResult = await fetch('http://localhost:8000/api/flights/price-offer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flight_offer: selectedOffer
  })
});

const priced = await priceResult.json();

// 4. Create booking
const bookingResult = await fetch('http://localhost:8000/api/flights/create-booking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    flight_offer: priced.priced_offer,
    travelers: [
      {
        id: '1',
        dateOfBirth: '1985-03-15',
        name: {
          firstName: 'JOHN',
          lastName: 'SMITH'
        },
        gender: 'MALE',
        contact: {
          emailAddress: 'john.smith@email.com',
          phones: [{
            deviceType: 'MOBILE',
            countryCallingCode: '44',
            number: '7700900123'
          }]
        },
        documents: [{
          documentType: 'PASSPORT',
          number: 'AB123456',
          expiryDate: '2028-06-01',
          issuanceCountry: 'GB',
          validityCountry: 'GB',
          nationality: 'GB',
          holder: true
        }]
      }
    ]
  })
});

const booking = await bookingResult.json();

// 5. Store booking reference
console.log('Booking created:', booking.order_id);
console.log('PNR:', booking.pnr);

// 6. Later, check booking status
const statusResult = await fetch(
  `http://localhost:8000/api/flights/booking/${booking.order_id}`
);
const status = await statusResult.json();
```

## Database Storage

All Amadeus bookings are automatically stored in the `amadeus_bookings` table:

- `booking_id` - Internal booking ID
- `amadeus_order_id` - Amadeus order ID
- `pnr` - PNR/confirmation number
- `itinerary_id` - Linked itinerary (if applicable)
- `flight_booking_id` - Linked flight booking (if applicable)
- `booking_data_json` - Full booking data from Amadeus
- `status` - Booking status (confirmed, cancelled, etc.)

## Important Notes

### Pricing is Required

⚠️ **Always price the offer before booking!** Flight prices can change, and the priced offer ensures you have the correct final price.

### Traveler Documents

All travelers must have valid travel documents (passport, ID card, etc.) with:
- Document number
- Expiry date
- Issuance country
- Nationality
- Validity country

### Test Environment

Currently configured for Amadeus **test environment**:
- Bookings are simulated
- No real charges are made
- PNRs are test PNRs
- Use production credentials for real bookings

### Error Handling

All booking endpoints return:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common errors:
- `"Amadeus API credentials not configured"` - Check `.env` file
- `"Flight offer must be priced first"` - Price the offer before booking
- `"Invalid traveler data"` - Check document requirements
- `"Booking not found"` - Order ID or PNR doesn't exist

## Integration with Itineraries

After creating a booking, you can:

1. **Convert to FlightBooking format:**
   ```bash
   POST /api/flights/convert-amadeus-offer
   ```
   Use the booking data to create a FlightBooking for your itinerary.

2. **Link to Itinerary:**
   The booking is automatically stored with the order ID and PNR, which can be linked to your itinerary when compiling.

3. **Track Status:**
   Use sync endpoint to keep booking status up-to-date in your itinerary.

## Best Practices

1. **Always price before booking** - Prices can change
2. **Store order_id and PNR** - Use these for future lookups
3. **Sync regularly** - Use sync endpoint to get latest status
4. **Handle cancellations** - Update itinerary when booking is cancelled
5. **Validate documents** - Ensure all traveler documents are valid before booking

