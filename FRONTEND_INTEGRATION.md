# Frontend Integration Guide

## ✅ Frontend Wired to New Backend API

The frontend has been updated to work with the new backend API structure.

## What Was Updated

### 1. API Service (`frontend/src/services/api.ts`)

**Added:**
- ✅ Automatic authentication token handling via `createHeaders()`
- ✅ All new CRUD endpoints for flights, hotels, transfers, activities
- ✅ Booking-traveler linking endpoints
- ✅ Update/delete operations for all entities
- ✅ Flight status refresh endpoint
- ✅ Send itinerary endpoint
- ✅ Get current user endpoint

**Updated:**
- ✅ All endpoints now use automatic token injection
- ✅ Removed manual token parameters (handled automatically)
- ✅ Better error handling

### 2. Views Updated

**DMCView (`frontend/src/views/DMCView.tsx`):**
- ✅ Updated to use new booking creation flow (create booking, then link traveler)
- ✅ Fetches related data (travelers, flights, hotels, transfers, activities) when viewing booking
- ✅ Uses new API structure

**TravelerView (`frontend/src/views/TravelerView.tsx`):**
- ✅ Uses public itinerary endpoint
- ✅ Handles booking code lookup

**LoginView:**
- ✅ Already working with new auth endpoints

### 3. Authentication

**AuthContext (`frontend/src/contexts/AuthContext.tsx`):**
- ✅ Already compatible with new API
- ✅ Token stored in localStorage
- ✅ Auto-logout on 401 errors

## API Endpoints Available in Frontend

### Authentication
```typescript
api.login(email, password)
api.register(email, password, name, organization_name)
api.getCurrentUser()
```

### Bookings
```typescript
api.createBooking(title, start_date, end_date, total_travelers?, notes?)
api.getBookings(status?)
api.getBooking(booking_id)
api.updateBooking(booking_id, data)
api.deleteBooking(booking_id)
api.linkTravelerToBooking(booking_id, traveler_id, is_primary)
api.getBookingTravelers(booking_id)
api.sendItinerary(booking_id)
api.getBookingMessages(booking_id)
```

### Travelers
```typescript
api.getTravelers()
api.createTraveler(first_name, last_name, phone, email?, phone_country_code?)
api.getTraveler(traveler_id)
api.updateTraveler(traveler_id, data)
```

### Flights
```typescript
api.searchFlights(request)
api.addFlightToBooking(booking_id, flightData)
api.getBookingFlights(booking_id)
api.getFlight(flight_id)
api.updateFlight(flight_id, data)
api.deleteFlight(flight_id)
api.refreshFlightStatus(flight_id)
```

### Hotels
```typescript
api.addHotelToBooking(booking_id, hotelData)
api.getBookingHotels(booking_id)
api.getHotel(hotel_id)
api.updateHotel(hotel_id, data)
api.deleteHotel(hotel_id)
```

### Transfers
```typescript
api.addTransferToBooking(booking_id, transferData)
api.getBookingTransfers(booking_id)
api.updateTransfer(transfer_id, data)
api.deleteTransfer(transfer_id)
```

### Activities
```typescript
api.addActivityToBooking(booking_id, activityData)
api.getBookingActivities(booking_id)
api.updateActivity(activity_id, data)
api.deleteActivity(activity_id)
```

### Public
```typescript
api.getPublicItinerary(booking_code)
```

## How It Works

### Authentication Flow

1. User logs in → `api.login()` → Token stored in localStorage
2. All subsequent requests automatically include token via `createHeaders()`
3. On 401 error → Auto-logout and redirect to login

### Creating a Booking

```typescript
// 1. Create traveler
const traveler = await api.createTraveler(first_name, last_name, phone, email);

// 2. Create booking
const booking = await api.createBooking(title, start_date, end_date);

// 3. Link traveler to booking
await api.linkTravelerToBooking(booking.id, traveler.id, true);
```

### Adding Components to Booking

```typescript
// Add flight
await api.addFlightToBooking(booking_id, {
  carrier_code: 'KQ',
  flight_number: '101',
  departure_date: '2025-03-15',
  departure_airport: 'LHR',
  arrival_airport: 'NBO',
  scheduled_departure: '2025-03-15T21:15:00',
  scheduled_arrival: '2025-03-16T06:25:00'
});

// Add hotel
await api.addHotelToBooking(booking_id, {
  hotel_name: 'Hemingways Nairobi',
  check_in_date: '2025-03-15',
  check_out_date: '2025-03-16',
  room_type: 'Deluxe Room'
});

// Add transfer
await api.addTransferToBooking(booking_id, {
  scheduled_datetime: '2025-03-16T07:00:00',
  from_location: 'NBO Airport',
  to_location: 'Hemingways Nairobi',
  transfer_type: 'airport_pickup'
});

// Add activity
await api.addActivityToBooking(booking_id, {
  activity_name: 'Morning Game Drive',
  scheduled_datetime: '2025-03-16T06:00:00',
  duration_minutes: 180,
  location: 'Masai Mara'
});
```

## Environment Configuration

Make sure `frontend/.env` has:

```bash
VITE_API_URL=http://localhost:8000
```

Or in `vite.config.ts`, you can set up a proxy:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

## Testing the Integration

1. **Start Backend:**
   ```bash
   python main.py
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow:**
   - Register/Login at http://localhost:3000/login
   - Create a booking
   - Add flights, hotels, transfers, activities
   - View booking details
   - Send itinerary (stub)

## Next Steps for Frontend

### Components to Add

1. **Flight Management Component**
   - Add/edit/delete flights
   - Search flights from Amadeus
   - Refresh flight status

2. **Hotel Management Component**
   - Add/edit/delete hotels
   - Search hotels (when Amadeus hotel search is implemented)

3. **Transfer Management Component**
   - Add/edit/delete transfers
   - Manage driver information

4. **Activity Management Component**
   - Add/edit/delete activities
   - Schedule activities

5. **Traveler Management Component**
   - List all travelers
   - Link travelers to bookings
   - Manage traveler details

6. **Itinerary Compiler View**
   - Compile all components into itinerary
   - Preview itinerary
   - Send to traveler

### UI Improvements

- Add loading states for all operations
- Add success/error notifications
- Improve booking detail view to show all components
- Add filters and search for bookings
- Add booking status management

## Current Status

✅ **Working:**
- Authentication (login/register)
- Booking creation
- Booking listing
- Traveler creation
- Public itinerary access

⏳ **Ready to Use (API exists, UI needs components):**
- Flight CRUD
- Hotel CRUD
- Transfer CRUD
- Activity CRUD
- Booking-traveler linking
- Send itinerary

## Notes

- All API calls automatically include authentication token
- Error handling includes auto-logout on 401
- Token is stored in localStorage
- API base URL is configurable via environment variable

