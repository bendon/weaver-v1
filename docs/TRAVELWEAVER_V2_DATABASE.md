# TravelWeaver 2.0 - Database Design

**Version**: 2.0.0
**Date**: 2025-12-31
**Databases**: MongoDB (dynamic data) + SQLite (reference data)

---

## 📊 Database Strategy

### MongoDB - Primary Database (Dynamic Data)
**Use for**: Data that changes frequently, requires complex permissions, or has flexible schemas

- Users & Organizations
- Bookings & Itineraries
- Conversations & Messages
- Travelers & Profiles
- Payments & Transactions
- Notifications & Logs

### SQLite - Reference Database (Static Data)
**Use for**: Data that rarely changes, is read-only, or doesn't require permissions

- Airports & Airlines
- Countries & Currencies
- Content & Templates
- System Configuration
- Static Reference Data

---

## 🗄️ MongoDB Collections

### 1. `users` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "email": "john@example.com",
  "email_verified": true,
  "password_hash": "$2b$12$...",  // bcrypt hash
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+254712345678",
  "phone_verified": false,

  "role": "dmc_admin",  // superadmin, dmc_admin, dmc_manager, dmc_agent, traveler
  "organization_id": ObjectId("507f1f77bcf86cd799439012"),  // null for travelers

  "avatar_url": "https://cdn.example.com/avatars/user123.jpg",
  "timezone": "Africa/Nairobi",
  "locale": "en-KE",

  "preferences": {
    "currency": "USD",
    "language": "en",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    }
  },

  "metadata": {
    "last_login_at": ISODate("2025-01-10T10:30:00Z"),
    "login_count": 47,
    "ip_address": "41.90.xx.xx",
    "user_agent": "Mozilla/5.0..."
  },

  "is_active": true,
  "is_deleted": false,

  "created_at": ISODate("2024-06-15T08:00:00Z"),
  "updated_at": ISODate("2025-01-10T10:30:00Z")
}

// Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "organization_id": 1 })
db.users.createIndex({ "role": 1 })
db.users.createIndex({ "created_at": -1 })
```

### 2. `organizations` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "name": "Safari Adventures Kenya",
  "slug": "safari-adventures-kenya",  // URL-friendly unique identifier
  "type": "dmc",  // dmc, travel_agency, tour_operator

  "contact": {
    "email": "info@safarikenya.com",
    "phone": "+254712345678",
    "website": "https://safarikenya.com",
    "address": {
      "street": "123 Kenyatta Avenue",
      "city": "Nairobi",
      "state": "Nairobi",
      "country": "KE",
      "postal_code": "00100"
    }
  },

  "branding": {
    "logo_url": "https://cdn.example.com/logos/safari-kenya.png",
    "primary_color": "#2D5F3F",
    "secondary_color": "#D4A574",
    "tagline": "Discover the Magic of Kenya"
  },

  "settings": {
    "currency": "USD",
    "timezone": "Africa/Nairobi",
    "languages": ["en", "sw"],
    "working_hours": {
      "monday": {"start": "08:00", "end": "18:00"},
      "tuesday": {"start": "08:00", "end": "18:00"},
      // ... other days
      "sunday": null  // closed
    }
  },

  "services": {
    "flights": {
      "enabled": true,
      "provider": "amadeus",
      "markup_percentage": 5
    },
    "hotels": {
      "enabled": true,
      "provider": "amadeus",
      "markup_percentage": 10
    },
    "transport": {
      "enabled": true,
      "own_fleet": true,
      "markup_percentage": 15
    },
    "experiences": {
      "enabled": true,
      "categories": ["safari", "cultural", "adventure"],
      "markup_percentage": 20
    }
  },

  "subscription": {
    "plan": "professional",  // free, starter, professional, enterprise
    "status": "active",
    "billing_cycle": "monthly",
    "next_billing_date": ISODate("2025-02-01T00:00:00Z"),
    "payment_method_id": "pm_1234567890"
  },

  "statistics": {
    "total_bookings": 1247,
    "total_revenue": 487650.00,
    "active_travelers": 523,
    "team_members": 8
  },

  "is_active": true,
  "is_verified": true,

  "created_at": ISODate("2024-01-10T00:00:00Z"),
  "updated_at": ISODate("2025-01-10T10:00:00Z")
}

// Indexes
db.organizations.createIndex({ "slug": 1 }, { unique: true })
db.organizations.createIndex({ "type": 1 })
db.organizations.createIndex({ "subscription.status": 1 })
```

### 3. `bookings` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "booking_code": "TW-2025-A7B9C1",  // Unique booking reference

  "organization_id": ObjectId("507f1f77bcf86cd799439012"),
  "created_by": ObjectId("507f1f77bcf86cd799439011"),  // User who created
  "assigned_to": ObjectId("507f1f77bcf86cd799439014"),  // Agent assigned

  "traveler": {
    "traveler_id": ObjectId("507f1f77bcf86cd799439015"),
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "is_primary": true
  },

  "additional_travelers": [
    {
      "traveler_id": ObjectId("507f1f77bcf86cd799439016"),
      "first_name": "John",
      "last_name": "Smith",
      "relationship": "spouse"
    }
  ],

  "trip": {
    "title": "10-Day Kenya Safari Adventure",
    "description": "Experience the best of Kenya's wildlife...",
    "destination": {
      "country": "KE",
      "city": "Nairobi",
      "region": "East Africa"
    },
    "start_date": ISODate("2025-03-15T00:00:00Z"),
    "end_date": ISODate("2025-03-25T00:00:00Z"),
    "duration_days": 10,
    "total_travelers": 2
  },

  "services": {
    "flights": [
      {
        "service_id": "flt_001",
        "type": "outbound",
        "carrier_code": "KQ",
        "flight_number": "KQ101",
        "departure": {
          "airport_code": "JFK",
          "city": "New York",
          "datetime": ISODate("2025-03-15T18:00:00Z")
        },
        "arrival": {
          "airport_code": "NBO",
          "city": "Nairobi",
          "datetime": ISODate("2025-03-16T14:00:00Z")
        },
        "cabin_class": "economy",
        "price": {
          "amount": 1200.00,
          "currency": "USD"
        },
        "status": "confirmed",
        "pnr": "ABCD123"
      }
      // ... return flight
    ],

    "hotels": [
      {
        "service_id": "htl_001",
        "name": "Safari Park Hotel",
        "city": "Nairobi",
        "check_in": ISODate("2025-03-16T14:00:00Z"),
        "check_out": ISODate("2025-03-18T11:00:00Z"),
        "nights": 2,
        "room_type": "Deluxe Double",
        "price": {
          "amount": 300.00,
          "currency": "USD"
        },
        "status": "confirmed",
        "confirmation_number": "HTL789"
      }
      // ... other hotels
    ],

    "transport": [
      {
        "service_id": "trn_001",
        "type": "airport_transfer",
        "from": "Jomo Kenyatta International Airport",
        "to": "Safari Park Hotel",
        "datetime": ISODate("2025-03-16T15:00:00Z"),
        "vehicle_type": "SUV",
        "capacity": 4,
        "driver": {
          "name": "Joseph Mutua",
          "phone": "+254700123456"
        },
        "price": {
          "amount": 50.00,
          "currency": "USD"
        },
        "status": "confirmed"
      }
      // ... other transfers
    ],

    "experiences": [
      {
        "service_id": "exp_001",
        "type": "safari",
        "title": "Masai Mara Full Day Game Drive",
        "category": "wildlife",
        "date": ISODate("2025-03-20T06:00:00Z"),
        "duration_hours": 8,
        "group_size": 2,
        "includes": [
          "Professional guide",
          "Packed lunch",
          "Park fees",
          "Binoculars"
        ],
        "price": {
          "amount": 250.00,
          "currency": "USD"
        },
        "status": "confirmed"
      }
      // ... other experiences
    ]
  },

  "pricing": {
    "services_total": 4500.00,
    "taxes": 450.00,
    "discounts": 0.00,
    "total": 4950.00,
    "currency": "USD",
    "breakdown": {
      "flights": 2400.00,
      "hotels": 1200.00,
      "transport": 300.00,
      "experiences": 600.00
    }
  },

  "payment": {
    "status": "paid",  // pending, partial, paid, refunded
    "method": "credit_card",
    "paid_amount": 4950.00,
    "pending_amount": 0.00,
    "payment_schedule": [
      {
        "description": "Deposit (50%)",
        "amount": 2475.00,
        "due_date": ISODate("2025-02-01T00:00:00Z"),
        "paid": true,
        "paid_at": ISODate("2025-01-28T14:30:00Z"),
        "transaction_id": "txn_abc123"
      },
      {
        "description": "Final payment (50%)",
        "amount": 2475.00,
        "due_date": ISODate("2025-03-01T00:00:00Z"),
        "paid": true,
        "paid_at": ISODate("2025-02-26T10:15:00Z"),
        "transaction_id": "txn_def456"
      }
    ]
  },

  "status": "confirmed",  // draft, pending, confirmed, in_progress, completed, cancelled
  "stage": "pre_trip",  // pre_trip, on_trip, post_trip

  "documents": [
    {
      "type": "itinerary",
      "url": "https://cdn.example.com/docs/itinerary_TW2025A7B9C1.pdf",
      "generated_at": ISODate("2025-01-30T09:00:00Z")
    },
    {
      "type": "invoice",
      "url": "https://cdn.example.com/docs/invoice_TW2025A7B9C1.pdf",
      "generated_at": ISODate("2025-01-28T14:35:00Z")
    }
  ],

  "notes": [
    {
      "author_id": ObjectId("507f1f77bcf86cd799439011"),
      "author_name": "John Doe",
      "content": "Client requested vegetarian meals",
      "created_at": ISODate("2025-01-25T11:00:00Z")
    }
  ],

  "metadata": {
    "source": "weaver_assistant",  // web, api, weaver_assistant, import
    "conversation_id": ObjectId("507f1f77bcf86cd799439020"),
    "tags": ["safari", "family", "luxury"],
    "custom_fields": {}
  },

  "created_at": ISODate("2025-01-20T10:30:00Z"),
  "updated_at": ISODate("2025-02-26T10:15:00Z")
}

// Indexes
db.bookings.createIndex({ "booking_code": 1 }, { unique: true })
db.bookings.createIndex({ "organization_id": 1 })
db.bookings.createIndex({ "traveler.traveler_id": 1 })
db.bookings.createIndex({ "status": 1 })
db.bookings.createIndex({ "trip.start_date": 1 })
db.bookings.createIndex({ "created_at": -1 })
db.bookings.createIndex({ "created_by": 1 })
```

### 4. `conversations` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439020"),

  "user_id": ObjectId("507f1f77bcf86cd799439015"),
  "organization_id": ObjectId("507f1f77bcf86cd799439012"),  // null for public travelers

  "mode": "traveler",  // dmc, traveler
  "interface": "web",  // web, mobile, api, whatsapp

  "title": "Kenya Safari Planning",
  "summary": "Planning a 10-day safari trip to Kenya for 2 people",

  "status": "active",  // active, archived, deleted
  "stage": "planning",  // planning, booking, confirmed, completed

  "context": {
    "current_booking_id": ObjectId("507f1f77bcf86cd799439013"),
    "destination": "Kenya",
    "trip_type": "safari",
    "budget_range": "mid_range",
    "travelers_count": 2
  },

  "messages": [
    {
      "message_id": "msg_001",
      "role": "user",
      "content": "I want to plan a safari trip to Kenya",
      "timestamp": ISODate("2025-01-20T10:00:00Z"),
      "metadata": {
        "ip_address": "41.90.xx.xx",
        "user_agent": "Mozilla/5.0..."
      }
    },
    {
      "message_id": "msg_002",
      "role": "assistant",
      "content": "I'd be happy to help you plan an amazing safari trip to Kenya! To create the perfect itinerary, could you tell me:\n\n1. How many days do you have for the trip?\n2. How many travelers will be joining?\n3. What's your approximate budget per person?\n4. Any specific wildlife or experiences you're hoping to see?",
      "intent": "gather_requirements",
      "timestamp": ISODate("2025-01-20T10:00:05Z"),
      "metadata": {
        "model": "claude-3-5-haiku-20241022",
        "cost": 0.0003
      }
    },
    {
      "message_id": "msg_003",
      "role": "user",
      "content": "10 days, 2 people, around $5000 per person. We want to see the Big Five and visit Masai Mara",
      "timestamp": ISODate("2025-01-20T10:02:30Z")
    },
    {
      "message_id": "msg_004",
      "role": "assistant",
      "content": "Perfect! A 10-day safari for 2 people with a budget of $10,000 total will give you an excellent experience...",
      "intent": "create_itinerary_proposal",
      "workflow": {
        "type": "search_experiences",
        "params": {
          "category": "safari",
          "destination": "Kenya",
          "duration": 10,
          "travelers": 2,
          "budget": 10000
        },
        "result": {
          "success": true,
          "experiences_found": 5
        }
      },
      "data": {
        "experiences": [...]
      },
      "timestamp": ISODate("2025-01-20T10:02:45Z")
    }
    // ... more messages
  ],

  "tags": ["safari", "kenya", "masai_mara", "big_five"],

  "metadata": {
    "message_count": 15,
    "total_cost": 0.0045,
    "avg_response_time_ms": 850,
    "user_satisfied": null  // true, false, null
  },

  "created_at": ISODate("2025-01-20T10:00:00Z"),
  "updated_at": ISODate("2025-01-20T11:30:00Z"),
  "last_message_at": ISODate("2025-01-20T11:30:00Z")
}

// Indexes
db.conversations.createIndex({ "user_id": 1 })
db.conversations.createIndex({ "organization_id": 1 })
db.conversations.createIndex({ "status": 1 })
db.conversations.createIndex({ "mode": 1 })
db.conversations.createIndex({ "created_at": -1 })
db.conversations.createIndex({ "context.current_booking_id": 1 })
```

### 5. `travelers` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439015"),

  "user_id": ObjectId("507f1f77bcf86cd799439011"),  // Linked user account (if registered)
  "organization_id": ObjectId("507f1f77bcf86cd799439012"),  // DMC who manages this traveler

  "personal_info": {
    "first_name": "Jane",
    "middle_name": null,
    "last_name": "Smith",
    "date_of_birth": ISODate("1985-06-15T00:00:00Z"),
    "gender": "female",
    "nationality": "US"
  },

  "contact": {
    "email": "jane@example.com",
    "phone": "+1234567890",
    "alternative_phone": null,
    "preferred_contact": "email"
  },

  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postal_code": "10001"
  },

  "passport": {
    "number": "AB1234567",
    "country": "US",
    "issue_date": ISODate("2020-01-15T00:00:00Z"),
    "expiry_date": ISODate("2030-01-14T00:00:00Z"),
    "scan_url": "https://cdn.example.com/docs/passport_jane_smith.pdf"
  },

  "preferences": {
    "dietary": ["vegetarian"],
    "accessibility": [],
    "interests": ["wildlife", "photography", "cultural_experiences"],
    "accommodation_preference": "mid_range",
    "travel_style": "adventure"
  },

  "travel_history": {
    "total_bookings": 3,
    "countries_visited": ["KE", "TZ", "ZA"],
    "favorite_destinations": ["KE"],
    "total_spent": 15000.00,
    "last_trip_date": ISODate("2024-08-20T00:00:00Z")
  },

  "emergency_contact": {
    "name": "John Smith",
    "relationship": "spouse",
    "phone": "+1234567891",
    "email": "john@example.com"
  },

  "marketing": {
    "opt_in_email": true,
    "opt_in_sms": false,
    "source": "website",  // website, referral, social_media, advertisement
    "referrer": null
  },

  "tags": ["vip", "repeat_customer"],

  "notes": [
    {
      "author_id": ObjectId("507f1f77bcf86cd799439011"),
      "content": "Prefers early morning game drives",
      "created_at": ISODate("2024-06-15T10:00:00Z")
    }
  ],

  "is_active": true,

  "created_at": ISODate("2024-06-15T08:00:00Z"),
  "updated_at": ISODate("2025-01-20T10:30:00Z")
}

// Indexes
db.travelers.createIndex({ "user_id": 1 })
db.travelers.createIndex({ "organization_id": 1 })
db.travelers.createIndex({ "contact.email": 1 })
db.travelers.createIndex({ "contact.phone": 1 })
db.travelers.createIndex({ "tags": 1 })
```

### 6. `payments` Collection

```javascript
{
  "_id": ObjectId("507f1f77bcf86cd799439030"),

  "booking_id": ObjectId("507f1f77bcf86cd799439013"),
  "organization_id": ObjectId("507f1f77bcf86cd799439012"),
  "traveler_id": ObjectId("507f1f77bcf86cd799439015"),

  "transaction_id": "txn_abc123",  // Internal transaction ID
  "external_id": "pi_1234567890",  // Payment provider ID (Stripe, PayPal, etc.)

  "amount": 2475.00,
  "currency": "USD",

  "type": "booking_deposit",  // booking_deposit, final_payment, refund, cancellation_fee

  "method": "credit_card",  // credit_card, debit_card, bank_transfer, mobile_money, paypal
  "provider": "stripe",  // stripe, paypal, flutterwave, mpesa

  "card": {
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2026
  },

  "status": "succeeded",  // pending, processing, succeeded, failed, refunded

  "metadata": {
    "ip_address": "41.90.xx.xx",
    "user_agent": "Mozilla/5.0...",
    "receipt_url": "https://cdn.example.com/receipts/txn_abc123.pdf"
  },

  "created_at": ISODate("2025-01-28T14:30:00Z"),
  "updated_at": ISODate("2025-01-28T14:30:15Z"),
  "succeeded_at": ISODate("2025-01-28T14:30:15Z")
}

// Indexes
db.payments.createIndex({ "booking_id": 1 })
db.payments.createIndex({ "transaction_id": 1 }, { unique: true })
db.payments.createIndex({ "organization_id": 1 })
db.payments.createIndex({ "status": 1 })
db.payments.createIndex({ "created_at": -1 })
```

---

## 🗂️ SQLite Tables (Reference Data)

### Database: `reference.db`

#### 1. `airports` Table

```sql
CREATE TABLE airports (
    iata_code TEXT PRIMARY KEY,
    icao_code TEXT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    altitude_ft INTEGER,
    timezone TEXT,
    dst_offset INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airports_city ON airports(city);
CREATE INDEX idx_airports_country ON airports(country_code);
CREATE INDEX idx_airports_name ON airports(name);

-- Example data
INSERT INTO airports VALUES
('NBO', 'HKJK', 'Jomo Kenyatta International Airport', 'Nairobi', 'KE', 'Kenya', -1.319167, 36.927778, 5327, 'Africa/Nairobi', 3, 1, '2025-01-01 00:00:00'),
('JFK', 'KJFK', 'John F Kennedy International Airport', 'New York', 'US', 'United States', 40.639751, -73.778925, 13, 'America/New_York', -5, 1, '2025-01-01 00:00:00');
```

#### 2. `airlines` Table

```sql
CREATE TABLE airlines (
    iata_code TEXT PRIMARY KEY,
    icao_code TEXT,
    name TEXT NOT NULL,
    country_code TEXT,
    country_name TEXT,
    alliance TEXT,  -- star_alliance, oneworld, skyteam
    logo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airlines_country ON airlines(country_code);
CREATE INDEX idx_airlines_alliance ON airlines(alliance);

-- Example data
INSERT INTO airlines VALUES
('KQ', 'KQA', 'Kenya Airways', 'KE', 'Kenya', 'skyteam', 'https://cdn.example.com/logos/kq.png', 1, '2025-01-01 00:00:00'),
('BA', 'BAW', 'British Airways', 'GB', 'United Kingdom', 'oneworld', 'https://cdn.example.com/logos/ba.png', 1, '2025-01-01 00:00:00');
```

#### 3. `countries` Table

```sql
CREATE TABLE countries (
    code TEXT PRIMARY KEY,  -- ISO 3166-1 alpha-2
    code_alpha3 TEXT,  -- ISO 3166-1 alpha-3
    name TEXT NOT NULL,
    continent TEXT,
    region TEXT,
    capital TEXT,
    currency_code TEXT,
    phone_code TEXT,
    languages TEXT,  -- JSON array
    timezone TEXT,
    flag_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_countries_continent ON countries(continent);
CREATE INDEX idx_countries_region ON countries(region);

-- Example data
INSERT INTO countries VALUES
('KE', 'KEN', 'Kenya', 'Africa', 'East Africa', 'Nairobi', 'KES', '+254', '["en","sw"]', 'Africa/Nairobi', 'https://cdn.example.com/flags/ke.svg', 1, '2025-01-01 00:00:00'),
('US', 'USA', 'United States', 'North America', 'Northern America', 'Washington D.C.', 'USD', '+1', '["en"]', 'America/New_York', 'https://cdn.example.com/flags/us.svg', 1, '2025-01-01 00:00:00');
```

#### 4. `currencies` Table

```sql
CREATE TABLE currencies (
    code TEXT PRIMARY KEY,  -- ISO 4217
    name TEXT NOT NULL,
    symbol TEXT,
    exchange_rate_usd REAL,  -- Exchange rate to USD
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT 1,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO currencies VALUES
('USD', 'US Dollar', '$', 1.0, 2, 1, '2025-01-01 00:00:00'),
('KES', 'Kenyan Shilling', 'KSh', 0.0077, 2, 1, '2025-01-01 00:00:00'),
('EUR', 'Euro', '€', 1.08, 2, 1, '2025-01-01 00:00:00');
```

#### 5. `content` Table

```sql
CREATE TABLE content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,  -- blog_post, destination_guide, faq, page
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,  -- HTML or Markdown
    author_id TEXT,
    author_name TEXT,
    category TEXT,
    tags TEXT,  -- JSON array
    featured_image_url TEXT,
    seo_title TEXT,
    seo_description TEXT,
    is_published BOOLEAN DEFAULT 0,
    published_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_category ON content(category);
CREATE INDEX idx_content_published ON content(is_published);

-- Example data
INSERT INTO content (slug, type, title, excerpt, content, category, tags, is_published, published_at) VALUES
('kenya-safari-guide', 'destination_guide', 'Complete Guide to Kenya Safari', 'Everything you need to know...', '<h1>Kenya Safari Guide</h1>...', 'destinations', '["kenya","safari","wildlife"]', 1, '2025-01-01 00:00:00');
```

#### 6. `email_templates` Table

```sql
CREATE TABLE email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    variables TEXT,  -- JSON array of placeholders
    category TEXT,  -- booking, payment, notification, marketing
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Example data
INSERT INTO email_templates (slug, name, subject, html_body, variables, category) VALUES
('booking-confirmation', 'Booking Confirmation', 'Your TravelWeaver Booking #{booking_code} is Confirmed!', '<html>...</html>', '["booking_code","traveler_name","trip_title"]', 'booking');
```

---

## 🔄 Data Relationships

### MongoDB References

```javascript
// One-to-Many: Organization → Users
users.organization_id → organizations._id

// One-to-Many: Organization → Bookings
bookings.organization_id → organizations._id

// One-to-Many: User → Conversations
conversations.user_id → users._id

// One-to-One: Booking ↔ Conversation
bookings.metadata.conversation_id → conversations._id
conversations.context.current_booking_id → bookings._id

// One-to-Many: Traveler → Bookings
bookings.traveler.traveler_id → travelers._id

// One-to-Many: Booking → Payments
payments.booking_id → bookings._id
```

### Cross-Database Lookups

```python
# Example: Get airport details for a flight
booking = db.bookings.find_one({"_id": booking_id})
flight = booking["services"]["flights"][0]
airport_code = flight["departure"]["airport_code"]

# Query SQLite
cursor = sqlite_conn.execute(
    "SELECT * FROM airports WHERE iata_code = ?",
    (airport_code,)
)
airport = cursor.fetchone()
```

---

## 📈 Data Migration Strategy

### From TravelWeaver v1 to v2

```python
# Migration script outline
async def migrate_data():
    # 1. Migrate users
    old_users = old_db.users.find()
    for user in old_users:
        new_user = transform_user(user)
        await new_db.users.insert_one(new_user)

    # 2. Migrate bookings
    old_bookings = old_db.bookings.find()
    for booking in old_bookings:
        new_booking = transform_booking(booking)
        await new_db.bookings.insert_one(new_booking)

    # 3. Verify data integrity
    verify_migration()
```

---

## 🎯 Next Steps

1. Review database schemas
2. Approve collection/table structures
3. Prepare sample data
4. Move to API contract design

**Questions:**
1. Any collections/tables to add/remove?
2. Any fields missing in schemas?
3. Should we include more reference tables?
4. Ready to proceed to API design?
