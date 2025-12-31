# TravelWeaver 2.0 - API Specification

**Version**: 2.0
**Base URL**: `https://api.travelweaver.com/api/v1`
**Date**: 2025-12-31
**Status**: Design Phase

---

## Table of Contents

1. [API Design Principles](#api-design-principles)
2. [Authentication & Authorization](#authentication--authorization)
3. [Common Patterns](#common-patterns)
4. [DMC Portal API](#dmc-portal-api)
5. [Traveler Portal API](#traveler-portal-api)
6. [WeaverAssistant API](#weaverassistant-api)
7. [Service Layer API](#service-layer-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Versioning](#versioning)

---

## API Design Principles

### RESTful Design
- Resources as nouns (e.g., `/bookings`, `/travelers`)
- HTTP verbs for actions (GET, POST, PUT, PATCH, DELETE)
- Stateless requests
- Consistent naming conventions

### Response Format
All responses follow this structure:

```json
{
  "success": true,
  "data": { /* resource or array */ },
  "message": "Operation completed successfully",
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "v1"
  },
  "pagination": { /* if applicable */ }
}
```

### Naming Conventions
- Endpoints: `kebab-case` (e.g., `/flight-bookings`)
- Query parameters: `snake_case` (e.g., `?start_date=2025-01-15`)
- JSON keys: `snake_case` (e.g., `"booking_code": "TW-123"`)
- Collection names: plural (e.g., `/travelers` not `/traveler`)

### Performance
- Pagination for all list endpoints (default: 20 items)
- Field filtering with `?fields=` parameter
- Compression (gzip) for responses
- Response time target: <500ms for 95% of requests

---

## Authentication & Authorization

### Authentication Flow

#### 1. Register New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecureP@ss123",
  "full_name": "John Doe",
  "role": "dmc_admin",
  "organization": {
    "name": "Safari Adventures Ltd",
    "country": "KE",
    "business_type": "dmc"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_7x9m2k4n",
    "email": "john@example.com",
    "organization_id": "org_abc123",
    "verification_required": true
  },
  "message": "Registration successful. Please verify your email.",
  "meta": {
    "request_id": "req_reg001",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### 2. Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "verification_code": "ABC123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "verified": true,
    "user_id": "usr_7x9m2k4n"
  },
  "message": "Email verified successfully"
}
```

#### 3. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr_7x9m2k4n",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "dmc_admin",
      "organization_id": "org_abc123",
      "permissions": ["bookings:write", "travelers:write", "settings:write"]
    }
  },
  "message": "Login successful"
}
```

#### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

#### 5. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {access_token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 6. Password Reset Request
```http
POST /api/v1/auth/password-reset/request
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 7. Password Reset Confirm
```http
POST /api/v1/auth/password-reset/confirm
Content-Type: application/json

{
  "email": "john@example.com",
  "reset_code": "RST789",
  "new_password": "NewSecureP@ss456"
}
```

### Authorization Headers
All authenticated requests must include:

```http
Authorization: Bearer {access_token}
```

### Token Structure
JWT payload includes:
```json
{
  "sub": "usr_7x9m2k4n",
  "email": "john@example.com",
  "role": "dmc_admin",
  "org_id": "org_abc123",
  "permissions": ["bookings:write", "travelers:write"],
  "exp": 1737120000,
  "iat": 1737116400
}
```

---

## Common Patterns

### Pagination
All list endpoints support pagination:

```http
GET /api/v1/dmc/bookings?page=2&per_page=20
```

**Response includes pagination metadata**:
```json
{
  "success": true,
  "data": [ /* 20 bookings */ ],
  "pagination": {
    "current_page": 2,
    "per_page": 20,
    "total_items": 145,
    "total_pages": 8,
    "has_next": true,
    "has_prev": true,
    "next_page": 3,
    "prev_page": 1
  }
}
```

### Filtering
Filter by fields using query parameters:

```http
GET /api/v1/dmc/bookings?status=confirmed&start_date_from=2025-01-01&start_date_to=2025-12-31
```

**Common filter operators**:
- `field=value` - Exact match
- `field_from=value` - Greater than or equal
- `field_to=value` - Less than or equal
- `field_contains=value` - Contains substring
- `field_in=val1,val2,val3` - In list

### Sorting
Sort by fields:

```http
GET /api/v1/dmc/bookings?sort_by=created_at&sort_order=desc
```

### Field Selection
Request specific fields only:

```http
GET /api/v1/dmc/bookings?fields=booking_code,status,total_price,traveler.name
```

### Search
Full-text search:

```http
GET /api/v1/dmc/bookings?search=Safari%20Kenya
```

---

## DMC Portal API

Base path: `/api/v1/dmc`

### Dashboard & Analytics

#### Get Dashboard Overview
```http
GET /api/v1/dmc/dashboard
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_bookings": 342,
      "active_bookings": 89,
      "total_revenue": 456780.50,
      "pending_payments": 23450.00,
      "total_travelers": 1247,
      "conversations_today": 45
    },
    "recent_bookings": [ /* last 5 bookings */ ],
    "upcoming_trips": [ /* next 10 trips */ ],
    "pending_tasks": [
      {
        "type": "payment_reminder",
        "booking_code": "TW-2025-A7B9",
        "due_date": "2025-01-20",
        "amount": 2500.00
      }
    ],
    "revenue_chart": {
      "period": "last_30_days",
      "data": [
        { "date": "2025-01-01", "revenue": 12500.00 },
        { "date": "2025-01-02", "revenue": 8300.00 }
      ]
    }
  }
}
```

#### Get Analytics
```http
GET /api/v1/dmc/analytics?period=last_30_days&metrics=revenue,bookings,conversion_rate
Authorization: Bearer {token}
```

**Response**: Detailed analytics data with charts

### Booking Management

#### List All Bookings
```http
GET /api/v1/dmc/bookings?page=1&per_page=20&status=confirmed&sort_by=created_at&sort_order=desc
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "bkg_xyz789",
      "booking_code": "TW-2025-A7B9C1",
      "status": "confirmed",
      "traveler": {
        "id": "tvl_abc123",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "+1234567890"
      },
      "trip": {
        "title": "10-Day Kenya Safari Adventure",
        "destination": {
          "country": "KE",
          "country_name": "Kenya",
          "city": "Nairobi"
        },
        "start_date": "2025-02-15",
        "end_date": "2025-02-25",
        "duration_days": 10,
        "adults": 2,
        "children": 1
      },
      "pricing": {
        "total": 4950.00,
        "currency": "USD",
        "deposit": 1485.00,
        "balance": 3465.00
      },
      "payment": {
        "status": "partial",
        "paid_amount": 1485.00,
        "outstanding": 3465.00
      },
      "created_at": "2025-01-10T14:30:00Z",
      "updated_at": "2025-01-12T09:15:00Z"
    }
  ],
  "pagination": { /* pagination metadata */ }
}
```

#### Get Single Booking
```http
GET /api/v1/dmc/bookings/{booking_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "bkg_xyz789",
    "booking_code": "TW-2025-A7B9C1",
    "status": "confirmed",
    "traveler": {
      "id": "tvl_abc123",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "passport": {
        "number": "P12345678",
        "country": "US",
        "expiry_date": "2030-06-15"
      },
      "preferences": {
        "dietary": ["vegetarian"],
        "room_type": "double",
        "special_requests": "Ground floor room"
      }
    },
    "trip": {
      "title": "10-Day Kenya Safari Adventure",
      "description": "Experience the best of Kenya...",
      "destination": {
        "country": "KE",
        "country_name": "Kenya",
        "city": "Nairobi",
        "region": "East Africa"
      },
      "start_date": "2025-02-15",
      "end_date": "2025-02-25",
      "duration_days": 10,
      "adults": 2,
      "children": 1,
      "infants": 0
    },
    "services": {
      "flights": [
        {
          "id": "flt_123",
          "type": "outbound",
          "segments": [
            {
              "departure": {
                "airport": "JFK",
                "airport_name": "John F. Kennedy International",
                "city": "New York",
                "date": "2025-02-15",
                "time": "18:30"
              },
              "arrival": {
                "airport": "NBO",
                "airport_name": "Jomo Kenyatta International",
                "city": "Nairobi",
                "date": "2025-02-16",
                "time": "15:45"
              },
              "airline": "KQ",
              "airline_name": "Kenya Airways",
              "flight_number": "KQ002",
              "aircraft": "Boeing 787-8",
              "duration_minutes": 855,
              "cabin_class": "Economy"
            }
          ],
          "booking_reference": "ABC123",
          "status": "confirmed",
          "total_price": 1200.00
        }
      ],
      "hotels": [
        {
          "id": "htl_456",
          "name": "Nairobi Serena Hotel",
          "location": {
            "city": "Nairobi",
            "address": "Kenyatta Avenue, Nairobi",
            "coordinates": { "lat": -1.2864, "lng": 36.8172 }
          },
          "check_in": "2025-02-16",
          "check_out": "2025-02-18",
          "nights": 2,
          "rooms": [
            {
              "room_type": "Deluxe Double",
              "adults": 2,
              "children": 1,
              "rate_per_night": 180.00,
              "total": 360.00
            }
          ],
          "booking_reference": "HTL789",
          "status": "confirmed",
          "total_price": 360.00
        }
      ],
      "transport": [
        {
          "id": "trn_789",
          "type": "airport_transfer",
          "from": "Jomo Kenyatta International Airport",
          "to": "Nairobi Serena Hotel",
          "date": "2025-02-16",
          "time": "16:00",
          "vehicle_type": "SUV",
          "passengers": 3,
          "price": 45.00,
          "status": "confirmed"
        }
      ],
      "experiences": [
        {
          "id": "exp_101",
          "name": "Maasai Mara Safari - 3 Days",
          "type": "safari",
          "start_date": "2025-02-18",
          "end_date": "2025-02-21",
          "duration_days": 3,
          "includes": [
            "Game drives",
            "Park fees",
            "Accommodation (luxury tented camp)",
            "All meals",
            "Professional guide"
          ],
          "participants": 3,
          "price_per_person": 850.00,
          "total_price": 2550.00,
          "status": "confirmed"
        }
      ]
    },
    "pricing": {
      "services": {
        "flights": 1200.00,
        "hotels": 360.00,
        "transport": 45.00,
        "experiences": 2550.00
      },
      "subtotal": 4155.00,
      "taxes": 415.50,
      "fees": 79.50,
      "discounts": 0.00,
      "total": 4950.00,
      "currency": "USD"
    },
    "payment": {
      "status": "partial",
      "paid_amount": 1485.00,
      "outstanding": 3465.00,
      "payment_schedule": [
        {
          "type": "deposit",
          "amount": 1485.00,
          "due_date": "2025-01-10",
          "paid": true,
          "payment_date": "2025-01-10",
          "payment_method": "credit_card"
        },
        {
          "type": "balance",
          "amount": 3465.00,
          "due_date": "2025-02-01",
          "paid": false
        }
      ]
    },
    "documents": [
      {
        "type": "invoice",
        "url": "https://cdn.travelweaver.com/docs/inv_TW2025A7B9C1.pdf",
        "generated_at": "2025-01-10T14:35:00Z"
      },
      {
        "type": "itinerary",
        "url": "https://cdn.travelweaver.com/docs/itin_TW2025A7B9C1.pdf",
        "generated_at": "2025-01-10T14:35:00Z"
      }
    ],
    "notes": [
      {
        "id": "note_001",
        "author": "John Doe",
        "content": "Client requested window seats on flights",
        "created_at": "2025-01-11T10:00:00Z"
      }
    ],
    "created_at": "2025-01-10T14:30:00Z",
    "updated_at": "2025-01-12T09:15:00Z",
    "created_by": "usr_7x9m2k4n"
  }
}
```

#### Create Booking
```http
POST /api/v1/dmc/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "traveler_id": "tvl_abc123",
  "trip": {
    "title": "10-Day Kenya Safari Adventure",
    "destination": {
      "country": "KE",
      "city": "Nairobi"
    },
    "start_date": "2025-02-15",
    "end_date": "2025-02-25",
    "adults": 2,
    "children": 1
  },
  "services": {
    "flights": [ /* flight details */ ],
    "hotels": [ /* hotel details */ ],
    "transport": [ /* transport details */ ],
    "experiences": [ /* experience details */ ]
  },
  "pricing": {
    "total": 4950.00,
    "currency": "USD"
  },
  "payment_schedule": [
    {
      "type": "deposit",
      "amount": 1485.00,
      "due_date": "2025-01-10"
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "bkg_xyz789",
    "booking_code": "TW-2025-A7B9C1",
    "status": "pending_payment",
    /* ... full booking details ... */
  },
  "message": "Booking created successfully"
}
```

#### Update Booking
```http
PATCH /api/v1/dmc/bookings/{booking_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed",
  "services": {
    "flights": [ /* updated flight details */ ]
  }
}
```

**Response** (200 OK): Updated booking object

#### Cancel Booking
```http
POST /api/v1/dmc/bookings/{booking_id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Client requested cancellation",
  "refund_amount": 1000.00
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "bkg_xyz789",
    "status": "cancelled",
    "cancellation": {
      "cancelled_at": "2025-01-15T14:00:00Z",
      "cancelled_by": "usr_7x9m2k4n",
      "reason": "Client requested cancellation",
      "refund_amount": 1000.00,
      "refund_status": "pending"
    }
  },
  "message": "Booking cancelled successfully"
}
```

### Traveler Management

#### List Travelers
```http
GET /api/v1/dmc/travelers?page=1&per_page=20&search=jane
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "tvl_abc123",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+1234567890",
      "nationality": "US",
      "total_bookings": 3,
      "total_spent": 12450.00,
      "last_trip_date": "2024-11-20",
      "created_at": "2024-03-15T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Get Single Traveler
```http
GET /api/v1/dmc/travelers/{traveler_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "tvl_abc123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "nationality": "US",
    "date_of_birth": "1985-06-15",
    "passport": {
      "number": "P12345678",
      "country": "US",
      "issue_date": "2020-06-15",
      "expiry_date": "2030-06-15"
    },
    "preferences": {
      "dietary": ["vegetarian"],
      "seat_preference": "window",
      "room_type": "double",
      "special_needs": "Wheelchair accessible rooms"
    },
    "emergency_contact": {
      "name": "John Smith",
      "relationship": "Spouse",
      "phone": "+1234567891"
    },
    "travel_history": [
      {
        "booking_id": "bkg_previous1",
        "booking_code": "TW-2024-X1Y2Z3",
        "destination": "Tanzania",
        "trip_date": "2024-11-01",
        "amount_spent": 3800.00
      }
    ],
    "total_bookings": 3,
    "total_spent": 12450.00,
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### Create Traveler
```http
POST /api/v1/dmc/travelers
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "nationality": "US",
  "date_of_birth": "1985-06-15",
  "passport": {
    "number": "P12345678",
    "country": "US",
    "expiry_date": "2030-06-15"
  }
}
```

**Response** (201 Created): Full traveler object

#### Update Traveler
```http
PATCH /api/v1/dmc/travelers/{traveler_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+1234567899",
  "preferences": {
    "dietary": ["vegetarian", "gluten_free"]
  }
}
```

**Response** (200 OK): Updated traveler object

#### Delete Traveler
```http
DELETE /api/v1/dmc/travelers/{traveler_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Traveler deleted successfully"
}
```

### Payment Management

#### List Payments
```http
GET /api/v1/dmc/payments?page=1&per_page=20&status=pending
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "pmt_xyz123",
      "booking_id": "bkg_xyz789",
      "booking_code": "TW-2025-A7B9C1",
      "amount": 3465.00,
      "currency": "USD",
      "status": "pending",
      "type": "balance",
      "due_date": "2025-02-01",
      "payment_method": null,
      "created_at": "2025-01-10T14:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Record Payment
```http
POST /api/v1/dmc/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "booking_id": "bkg_xyz789",
  "amount": 3465.00,
  "payment_method": "bank_transfer",
  "transaction_id": "TXN789456",
  "notes": "Balance payment received via bank transfer"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "pmt_xyz124",
    "booking_id": "bkg_xyz789",
    "amount": 3465.00,
    "status": "completed",
    "payment_date": "2025-01-15T10:00:00Z",
    "receipt_url": "https://cdn.travelweaver.com/receipts/pmt_xyz124.pdf"
  },
  "message": "Payment recorded successfully"
}
```

### Organization Settings

#### Get Organization Profile
```http
GET /api/v1/dmc/organization
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "org_abc123",
    "name": "Safari Adventures Ltd",
    "business_type": "dmc",
    "country": "KE",
    "email": "info@safariadventures.com",
    "phone": "+254712345678",
    "website": "https://safariadventures.com",
    "address": {
      "street": "123 Safari Street",
      "city": "Nairobi",
      "postal_code": "00100",
      "country": "KE"
    },
    "branding": {
      "logo_url": "https://cdn.travelweaver.com/logos/org_abc123.png",
      "primary_color": "#2C5F2D",
      "secondary_color": "#97BC62"
    },
    "settings": {
      "default_currency": "USD",
      "timezone": "Africa/Nairobi",
      "languages": ["en", "sw"],
      "payment_terms_days": 30,
      "deposit_percentage": 30
    },
    "subscription": {
      "plan": "professional",
      "status": "active",
      "billing_cycle": "monthly",
      "next_billing_date": "2025-02-01"
    },
    "created_at": "2024-01-10T08:00:00Z"
  }
}
```

#### Update Organization Profile
```http
PATCH /api/v1/dmc/organization
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+254712345679",
  "branding": {
    "primary_color": "#1E4620"
  },
  "settings": {
    "deposit_percentage": 25
  }
}
```

**Response** (200 OK): Updated organization object

#### Upload Logo
```http
POST /api/v1/dmc/organization/logo
Authorization: Bearer {token}
Content-Type: multipart/form-data

logo: [binary image file]
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logo_url": "https://cdn.travelweaver.com/logos/org_abc123_v2.png"
  },
  "message": "Logo uploaded successfully"
}
```

### User Management

#### List Organization Users
```http
GET /api/v1/dmc/users?page=1&per_page=20
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_7x9m2k4n",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "dmc_admin",
      "status": "active",
      "last_login": "2025-01-15T09:30:00Z",
      "created_at": "2024-01-10T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Invite User
```http
POST /api/v1/dmc/users/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "full_name": "New User",
  "role": "dmc_staff"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user_id": "usr_newuser1",
    "email": "newuser@example.com",
    "invitation_sent": true,
    "invitation_expires_at": "2025-01-22T10:00:00Z"
  },
  "message": "User invitation sent successfully"
}
```

#### Update User Role
```http
PATCH /api/v1/dmc/users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "dmc_manager"
}
```

#### Deactivate User
```http
POST /api/v1/dmc/users/{user_id}/deactivate
Authorization: Bearer {token}
```

---

## Traveler Portal API

Base path: `/api/v1/traveler`

### Public Endpoints (No Authentication Required)

#### Get DMC Public Profile
```http
GET /api/v1/traveler/dmc/{organization_slug}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "org_abc123",
    "name": "Safari Adventures Ltd",
    "slug": "safari-adventures",
    "tagline": "Discover the magic of East Africa",
    "description": "We specialize in luxury safaris across Kenya and Tanzania...",
    "logo_url": "https://cdn.travelweaver.com/logos/org_abc123.png",
    "cover_image_url": "https://cdn.travelweaver.com/covers/org_abc123.jpg",
    "location": {
      "country": "Kenya",
      "city": "Nairobi"
    },
    "contact": {
      "email": "info@safariadventures.com",
      "phone": "+254712345678",
      "website": "https://safariadventures.com"
    },
    "stats": {
      "total_trips": 450,
      "happy_clients": 1200,
      "years_experience": 15
    },
    "chat_enabled": true
  }
}
```

#### Start Anonymous Chat
```http
POST /api/v1/traveler/chat/anonymous/start
Content-Type: application/json

{
  "organization_slug": "safari-adventures",
  "visitor_info": {
    "name": "Guest User",
    "email": "guest@example.com"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_anon_xyz789",
    "session_token": "st_temp_abc123",
    "greeting_message": "Welcome to Safari Adventures! How can we help plan your dream safari today?"
  },
  "message": "Anonymous chat session started"
}
```

### Authenticated Endpoints

#### Get Traveler Profile
```http
GET /api/v1/traveler/profile
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "tvl_abc123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "avatar_url": "https://cdn.travelweaver.com/avatars/tvl_abc123.jpg",
    "nationality": "US",
    "date_of_birth": "1985-06-15",
    "passport": {
      "number": "P12345678",
      "country": "US",
      "expiry_date": "2030-06-15"
    },
    "preferences": {
      "dietary": ["vegetarian"],
      "seat_preference": "window",
      "room_type": "double"
    },
    "created_at": "2024-03-15T10:00:00Z"
  }
}
```

#### Update Traveler Profile
```http
PATCH /api/v1/traveler/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+1234567899",
  "preferences": {
    "dietary": ["vegetarian", "gluten_free"]
  }
}
```

#### Get My Bookings
```http
GET /api/v1/traveler/bookings?page=1&per_page=10&status=confirmed
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "bkg_xyz789",
      "booking_code": "TW-2025-A7B9C1",
      "dmc": {
        "id": "org_abc123",
        "name": "Safari Adventures Ltd",
        "logo_url": "https://cdn.travelweaver.com/logos/org_abc123.png"
      },
      "trip": {
        "title": "10-Day Kenya Safari Adventure",
        "destination": "Kenya",
        "start_date": "2025-02-15",
        "end_date": "2025-02-25",
        "duration_days": 10
      },
      "status": "confirmed",
      "total_price": 4950.00,
      "currency": "USD",
      "payment_status": "partial",
      "created_at": "2025-01-10T14:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Get Single Booking
```http
GET /api/v1/traveler/bookings/{booking_id}
Authorization: Bearer {token}
```

**Response** (200 OK): Full booking details (similar to DMC response but from traveler perspective)

#### Download Documents
```http
GET /api/v1/traveler/bookings/{booking_id}/documents/{document_type}
Authorization: Bearer {token}
```

**Supported document types**: `invoice`, `itinerary`, `receipt`, `voucher`

**Response** (200 OK): PDF file download

---

## WeaverAssistant API

Base path: `/api/v1/assistant`

### Chat Endpoints

#### Send Message (Hybrid Architecture)
```http
POST /api/v1/assistant/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I need a 10-day safari to Kenya for 2 adults and 1 child in February",
  "conversation_id": "conv_xyz789",
  "context": {
    "mode": "dmc",
    "organization_id": "org_abc123",
    "user_id": "usr_7x9m2k4n"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "conversation_id": "conv_xyz789",
    "response": "I'd be happy to help you plan a 10-day Kenya safari! I found several excellent options for February. Here are the top 5 safari packages tailored for your family...",
    "intent": "search_experiences",
    "intent_confidence": 0.95,
    "workflow_executed": "experience_search",
    "data": {
      "experiences": [
        {
          "id": "exp_safari1",
          "name": "Classic Kenya Safari - 10 Days",
          "description": "Experience Maasai Mara, Amboseli, and Lake Nakuru...",
          "duration_days": 10,
          "price_per_person": 2850.00,
          "total_price": 8550.00,
          "includes": ["Accommodation", "Game drives", "Park fees", "Meals"],
          "highlights": [
            "Big Five wildlife viewing",
            "Hot air balloon safari",
            "Maasai village visit"
          ]
        }
      ]
    },
    "suggested_actions": [
      {
        "type": "view_details",
        "label": "View full itinerary",
        "action": "view_experience_details",
        "params": { "experience_id": "exp_safari1" }
      },
      {
        "type": "add_to_booking",
        "label": "Add to booking",
        "action": "add_experience",
        "params": { "experience_id": "exp_safari1" }
      }
    ],
    "processing_time_ms": 850,
    "cost_estimate": "$0.0003"
  },
  "meta": {
    "request_id": "req_chat001",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

#### Get Conversation History
```http
GET /api/v1/assistant/conversations/{conversation_id}
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "conv_xyz789",
    "title": "10-Day Kenya Safari Planning",
    "status": "active",
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "I need a 10-day safari to Kenya",
        "timestamp": "2025-01-15T10:00:00Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "I'd be happy to help you plan...",
        "intent": "search_experiences",
        "data": { /* ... */ },
        "timestamp": "2025-01-15T10:00:02Z"
      }
    ],
    "metadata": {
      "total_messages": 12,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### List Conversations
```http
GET /api/v1/assistant/conversations?page=1&per_page=20&status=active
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_xyz789",
      "title": "10-Day Kenya Safari Planning",
      "status": "active",
      "last_message": "I'd be happy to help you plan...",
      "message_count": 12,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

#### Archive Conversation
```http
POST /api/v1/assistant/conversations/{conversation_id}/archive
Authorization: Bearer {token}
```

### Intent Classification (Internal Use)

#### Classify Intent
```http
POST /api/v1/assistant/intent/classify
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I need a flight to Paris next week",
  "context": {
    "conversation_id": "conv_xyz789",
    "previous_intents": ["search_flights"]
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "intent": "search_flights",
    "confidence": 0.95,
    "parameters": {
      "destination": "Paris",
      "destination_code": "CDG",
      "departure_date": "2025-01-22",
      "return_date": null,
      "adults": 1,
      "children": 0
    },
    "suggested_workflow": "flight_search",
    "processing_time_ms": 180
  }
}
```

### Performance Metrics

#### Get Assistant Performance
```http
GET /api/v1/assistant/performance
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "ai_first": {
      "cost_per_message": "$0.02-0.04",
      "avg_response_time": "4-6 seconds",
      "reliability": "95-98%"
    },
    "hybrid": {
      "cost_per_message": "$0.0003",
      "avg_response_time": "<1 second",
      "reliability": "99.9%+"
    },
    "improvement": {
      "cost_reduction": "70-90%",
      "speed_improvement": "5-6x faster",
      "reliability_improvement": "10-20x fewer errors"
    }
  }
}
```

---

## Service Layer API

Base path: `/api/v1/services`

### Flight Service

#### Search Flights
```http
POST /api/v1/services/flights/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "origin": "New York",
  "destination": "Nairobi",
  "departure_date": "2025-02-15",
  "return_date": "2025-02-25",
  "adults": 2,
  "children": 1,
  "cabin_class": "economy"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": "flt_offer_001",
        "type": "round_trip",
        "price": {
          "total": 1200.00,
          "currency": "USD",
          "per_person": 400.00
        },
        "outbound": {
          "segments": [
            {
              "departure": {
                "airport": "JFK",
                "city": "New York",
                "date": "2025-02-15",
                "time": "18:30"
              },
              "arrival": {
                "airport": "NBO",
                "city": "Nairobi",
                "date": "2025-02-16",
                "time": "15:45"
              },
              "airline": "KQ",
              "flight_number": "KQ002",
              "duration_minutes": 855,
              "cabin_class": "economy"
            }
          ],
          "total_duration_minutes": 855
        },
        "inbound": {
          "segments": [ /* ... */ ]
        },
        "booking_class": "Q",
        "seats_available": 7
      }
    ],
    "search_params": {
      "origin": "JFK",
      "destination": "NBO",
      "departure_date": "2025-02-15",
      "return_date": "2025-02-25"
    }
  },
  "meta": {
    "total_offers": 12,
    "search_time_ms": 450
  }
}
```

#### Book Flight
```http
POST /api/v1/services/flights/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "offer_id": "flt_offer_001",
  "passengers": [
    {
      "type": "adult",
      "title": "Ms",
      "first_name": "Jane",
      "last_name": "Smith",
      "date_of_birth": "1985-06-15",
      "passport": {
        "number": "P12345678",
        "country": "US",
        "expiry_date": "2030-06-15"
      }
    }
  ]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "booking_reference": "ABC123",
    "status": "confirmed",
    "flight_details": { /* ... */ },
    "tickets": [
      {
        "passenger_name": "Jane Smith",
        "ticket_number": "1234567890123",
        "eticket_url": "https://cdn.travelweaver.com/etickets/1234567890123.pdf"
      }
    ]
  },
  "message": "Flight booked successfully"
}
```

### Hotel Service

#### Search Hotels
```http
POST /api/v1/services/hotels/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "city": "Nairobi",
  "check_in": "2025-02-16",
  "check_out": "2025-02-18",
  "rooms": [
    {
      "adults": 2,
      "children": 1
    }
  ],
  "filters": {
    "min_price": 50,
    "max_price": 300,
    "star_rating": [4, 5],
    "amenities": ["pool", "wifi", "restaurant"]
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "htl_001",
        "name": "Nairobi Serena Hotel",
        "star_rating": 5,
        "location": {
          "address": "Kenyatta Avenue, Nairobi",
          "city": "Nairobi",
          "country": "KE",
          "coordinates": { "lat": -1.2864, "lng": 36.8172 }
        },
        "images": [
          "https://cdn.travelweaver.com/hotels/htl_001_1.jpg",
          "https://cdn.travelweaver.com/hotels/htl_001_2.jpg"
        ],
        "amenities": ["pool", "wifi", "restaurant", "spa", "gym"],
        "rooms": [
          {
            "room_type": "Deluxe Double",
            "description": "Spacious room with king bed and city view",
            "max_occupancy": 3,
            "price_per_night": 180.00,
            "total_price": 360.00,
            "currency": "USD",
            "available_rooms": 5
          }
        ],
        "rating": {
          "average": 4.7,
          "total_reviews": 1245
        }
      }
    ],
    "total_results": 24,
    "search_params": {
      "city": "Nairobi",
      "check_in": "2025-02-16",
      "check_out": "2025-02-18"
    }
  }
}
```

#### Book Hotel
```http
POST /api/v1/services/hotels/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "hotel_id": "htl_001",
  "room_type": "Deluxe Double",
  "check_in": "2025-02-16",
  "check_out": "2025-02-18",
  "guest": {
    "title": "Ms",
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890"
  },
  "special_requests": "Ground floor room preferred"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "booking_reference": "HTL789",
    "status": "confirmed",
    "hotel_name": "Nairobi Serena Hotel",
    "confirmation_email_sent": true,
    "voucher_url": "https://cdn.travelweaver.com/vouchers/HTL789.pdf"
  },
  "message": "Hotel booked successfully"
}
```

### Transport Service

#### Search Transport
```http
POST /api/v1/services/transport/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "airport_transfer",
  "from": "Jomo Kenyatta International Airport",
  "to": "Nairobi Serena Hotel",
  "date": "2025-02-16",
  "time": "16:00",
  "passengers": 3,
  "luggage": 3
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "options": [
      {
        "id": "trn_001",
        "type": "private_transfer",
        "vehicle_type": "SUV",
        "max_passengers": 4,
        "max_luggage": 4,
        "duration_minutes": 30,
        "price": 45.00,
        "currency": "USD",
        "provider": "SafariTransfers Ltd",
        "vehicle_details": {
          "model": "Toyota Land Cruiser",
          "year": 2023,
          "amenities": ["AC", "wifi", "water"]
        }
      }
    ]
  }
}
```

#### Book Transport
```http
POST /api/v1/services/transport/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "transport_id": "trn_001",
  "pickup_location": "Jomo Kenyatta International Airport",
  "dropoff_location": "Nairobi Serena Hotel",
  "pickup_date": "2025-02-16",
  "pickup_time": "16:00",
  "passenger_name": "Jane Smith",
  "passenger_phone": "+1234567890",
  "flight_number": "KQ002"
}
```

### Experience Service

#### Search Experiences
```http
POST /api/v1/services/experiences/search
Authorization: Bearer {token}
Content-Type: application/json

{
  "destination": "Kenya",
  "type": "safari",
  "start_date": "2025-02-18",
  "duration_days": 3,
  "participants": 3,
  "filters": {
    "price_range": { "min": 500, "max": 1500 },
    "difficulty": ["easy", "moderate"]
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "experiences": [
      {
        "id": "exp_safari1",
        "name": "Maasai Mara Safari - 3 Days",
        "type": "safari",
        "description": "Experience the world-famous Maasai Mara National Reserve...",
        "duration_days": 3,
        "location": {
          "country": "Kenya",
          "region": "Maasai Mara",
          "coordinates": { "lat": -1.5, "lng": 35.0 }
        },
        "includes": [
          "Game drives (morning & evening)",
          "Park fees",
          "Accommodation (luxury tented camp)",
          "All meals",
          "Professional guide",
          "4x4 safari vehicle"
        ],
        "highlights": [
          "Big Five wildlife viewing",
          "Great Migration (seasonal)",
          "Maasai village visit",
          "Sundowner drinks"
        ],
        "difficulty": "easy",
        "min_participants": 2,
        "max_participants": 6,
        "price_per_person": 850.00,
        "currency": "USD",
        "available_dates": [
          "2025-02-18",
          "2025-02-19",
          "2025-02-20"
        ],
        "images": [
          "https://cdn.travelweaver.com/experiences/exp_safari1_1.jpg"
        ],
        "rating": {
          "average": 4.9,
          "total_reviews": 342
        }
      }
    ],
    "total_results": 18
  }
}
```

#### Book Experience
```http
POST /api/v1/services/experiences/book
Authorization: Bearer {token}
Content-Type: application/json

{
  "experience_id": "exp_safari1",
  "start_date": "2025-02-18",
  "participants": [
    {
      "name": "Jane Smith",
      "age": 39,
      "dietary_requirements": ["vegetarian"]
    },
    {
      "name": "John Smith",
      "age": 42,
      "dietary_requirements": []
    },
    {
      "name": "Emma Smith",
      "age": 10,
      "dietary_requirements": []
    }
  ],
  "special_requests": "Please arrange for early morning game drive on day 2"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "booking_reference": "EXP789",
    "status": "confirmed",
    "total_price": 2550.00,
    "voucher_url": "https://cdn.travelweaver.com/vouchers/EXP789.pdf"
  },
  "message": "Experience booked successfully"
}
```

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: departure_date",
    "details": {
      "field": "departure_date",
      "constraint": "required"
    }
  },
  "meta": {
    "request_id": "req_err001",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

### HTTP Status Codes

| Code | Status | Usage |
|------|--------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Invalid or expired token |
| `PERMISSION_DENIED` | 403 | User lacks required permission |
| `RESOURCE_NOT_FOUND` | 404 | Resource does not exist |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `EXTERNAL_API_ERROR` | 500 | Third-party API error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INVALID_PAYMENT` | 400 | Payment validation failed |
| `BOOKING_UNAVAILABLE` | 400 | Service no longer available |

### Error Examples

#### Validation Error
```http
POST /api/v1/dmc/bookings
{
  "traveler_id": "tvl_abc123"
  // Missing required fields
}
```

**Response** (422 Unprocessable Entity):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "missing_fields": ["trip", "services", "pricing"]
    }
  }
}
```

#### Authentication Error
```http
GET /api/v1/dmc/bookings
Authorization: Bearer invalid_token
```

**Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid or expired access token"
  }
}
```

#### Rate Limit Error
**Response** (429 Too Many Requests):
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "limit": 100,
      "window": "1 minute",
      "retry_after": 60
    }
  }
}
```

---

## Rate Limiting

### Rate Limits by Plan

| Plan | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 30 | 500 | 5,000 |
| Basic | 60 | 1,500 | 20,000 |
| Professional | 120 | 5,000 | 100,000 |
| Enterprise | Custom | Custom | Custom |

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1737116460
```

### Handling Rate Limits

When rate limit is exceeded:
1. Server returns 429 status code
2. Response includes `retry_after` in seconds
3. Client should wait before retrying
4. Consider implementing exponential backoff

---

## Versioning

### URL Versioning

API version is included in the URL path:

```
https://api.travelweaver.com/api/v1/dmc/bookings
                                    ^^
                                  version
```

### Version Support Policy

- **Current version**: v1
- **Support period**: Minimum 12 months after new version release
- **Deprecation notice**: 6 months before sunset
- **Breaking changes**: Only in new major versions

### Version Header

Clients can also specify version via header:

```http
X-API-Version: v1
```

### Changelog

API changelog available at:
```
https://api.travelweaver.com/changelog
```

---

## Additional Endpoints

### Health Check
```http
GET /api/v1/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "2025-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "weaver_assistant": "healthy",
    "amadeus_api": "healthy"
  }
}
```

### API Documentation
```http
GET /api/v1/docs
```

Returns OpenAPI (Swagger) documentation.

### API Status
```http
GET /api/v1/status
```

Returns current API status and any ongoing incidents.

---

## Summary

### Key Design Decisions

1. **RESTful Architecture**: Standard HTTP verbs, resource-based URLs
2. **Consistent Response Format**: All responses follow the same structure
3. **JWT Authentication**: Token-based auth with refresh tokens
4. **Role-Based Access Control**: Granular permissions per role
5. **Pagination**: All list endpoints paginated (default 20 items)
6. **Field Filtering**: Clients can request specific fields only
7. **Comprehensive Error Handling**: Structured errors with codes and details
8. **Rate Limiting**: Tiered limits based on subscription plan
9. **URL Versioning**: Version in URL path for clarity
10. **Hybrid AI Architecture**: Minimal AI calls for cost efficiency

### Performance Targets

- **Response Time**: <500ms for 95% of requests
- **Availability**: 99.9% uptime
- **Rate Limits**: 30-120 requests/minute depending on plan
- **Payload Size**: Max 10MB per request
- **Pagination**: Default 20 items, max 100 items per page

### Security

- **Authentication**: JWT tokens with expiry
- **Authorization**: RBAC with granular permissions
- **HTTPS Only**: All API calls require HTTPS
- **Rate Limiting**: Protection against abuse
- **Input Validation**: All inputs validated
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Prevention**: Output sanitization

---

**End of API Specification**

This API specification provides a complete contract for all endpoints in TravelWeaver 2.0. All endpoints follow consistent patterns for requests, responses, errors, and security.
