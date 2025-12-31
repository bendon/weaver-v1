# TravelWeaver 2.0 - System Architecture Design

**Version**: 2.0.0
**Date**: 2025-12-31
**Status**: Design Review
**Target**: Production-ready, scalable travel platform

---

## 🎯 Executive Summary

TravelWeaver 2.0 is a service-oriented travel platform designed for scalability, maintainability, and extensibility. The system centers around **WeaverAssistant** - an intelligent AI orchestration layer that connects travelers and DMCs with comprehensive tourism services.

### Core Principles

1. **Service-Oriented Architecture** - Each domain is an independent service
2. **AI-Powered Orchestration** - WeaverAssistant as the intelligent entry point
3. **Dual Interface** - DMC (private) and Traveler (public) experiences
4. **Configuration-Driven** - Easy to extend with new services
5. **Production-Ready** - Built for real-world deployment from day one

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├──────────────────────────┬──────────────────────────────────┤
│   DMC Portal (Next.js)   │  Traveler Portal (Next.js)       │
│   - Dashboard            │  - Public Chat                   │
│   - Booking Management   │  - Trip Discovery                │
│   - Analytics            │  - Service Booking               │
│   - Team Management      │  - Real-time Support             │
└──────────────┬───────────┴─────────────┬────────────────────┘
               │                         │
               └─────────────┬───────────┘
                             │ HTTPS/REST
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│                   FastAPI (Python 3.11+)                     │
├──────────────────────────┬──────────────────────────────────┤
│  /api/v1/dmc/*          │  /api/v1/traveler/*              │
│  /api/v1/assistant/*    │  /api/v1/public/*                │
└──────────────┬───────────┴─────────────┬────────────────────┘
               │                         │
               ↓                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  WeaverAssistant Layer                       │
│                  (AI Orchestration)                          │
├──────────────────────────────────────────────────────────────┤
│  Intent Classification → Workflow Routing → Response Gen    │
│  (Claude Haiku)          (Code)            (Templates/AI)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
├────────────┬────────────┬────────────┬────────────┬─────────┤
│  Flights   │  Hotels    │ Transport  │Experiences │ Bookings│
│  Service   │  Service   │  Service   │  Service   │ Service │
└────────────┴────────────┴────────────┴────────────┴─────────┘
               │                         │
               ↓                         ↓
┌──────────────────────────┐  ┌──────────────────────────────┐
│   MongoDB (Primary DB)   │  │  SQLite (Reference Data)     │
│   - Users, Bookings      │  │  - Airports, Airlines        │
│   - Conversations        │  │  - Countries, Content        │
│   - Travelers, Payments  │  │  - Templates                 │
└──────────────────────────┘  └──────────────────────────────┘
```

---

## 📁 Project Structure (Detailed)

```
travelweaver-v2/
├── README.md
├── .gitignore
├── .env.example
│
├── backend/                           # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   │
│   │   ├── main.py                   # FastAPI application entry point
│   │   │
│   │   ├── core/                     # Core functionality (shared)
│   │   │   ├── __init__.py
│   │   │   ├── config.py             # Configuration management
│   │   │   ├── security.py           # JWT, password hashing, RBAC
│   │   │   ├── exceptions.py         # Custom exceptions
│   │   │   ├── logging.py            # Logging configuration
│   │   │   ├── database/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── mongodb.py        # MongoDB connection & utilities
│   │   │   │   ├── sqlite.py         # SQLite connection & utilities
│   │   │   │   └── base.py           # Base repository pattern
│   │   │   └── auth/
│   │   │       ├── __init__.py
│   │   │       ├── models.py         # User, Organization, Role models
│   │   │       ├── service.py        # AuthService
│   │   │       ├── repository.py     # MongoDB operations
│   │   │       ├── dependencies.py   # FastAPI dependencies
│   │   │       └── permissions.py    # RBAC permissions
│   │   │
│   │   ├── services/                 # Business logic services
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── flights/              # Flight booking service
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py         # Pydantic models (Flight, SearchParams)
│   │   │   │   ├── service.py        # FlightService (business logic)
│   │   │   │   ├── repository.py     # MongoDB operations
│   │   │   │   ├── providers/        # External API integrations
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── amadeus.py    # Amadeus API client
│   │   │   │   │   └── base.py       # Base provider interface
│   │   │   │   └── schemas.py        # Request/Response schemas
│   │   │   │
│   │   │   ├── hotels/               # Hotel booking service
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── providers/
│   │   │   │   │   └── amadeus.py
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── transport/            # Ground transport service
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py         # Transfer, Vehicle models
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── experiences/          # Tours, activities, excursions
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py         # Activity, Tour, Safari models
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── categories/       # Experience categories
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── safari.py
│   │   │   │   │   ├── diving.py
│   │   │   │   │   ├── cultural.py
│   │   │   │   │   └── adventure.py
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── bookings/             # Booking orchestration
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py         # Booking, Itinerary models
│   │   │   │   ├── service.py        # BookingService
│   │   │   │   ├── orchestrator.py   # Multi-service orchestration
│   │   │   │   ├── repository.py
│   │   │   │   ├── workflows/        # Booking workflows
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── create.py
│   │   │   │   │   ├── modify.py
│   │   │   │   │   └── cancel.py
│   │   │   │   ├── pricing.py        # Pricing engine
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── travelers/            # Traveler management
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   └── payments/             # Payment processing
│   │   │       ├── __init__.py
│   │   │       ├── models.py
│   │   │       ├── service.py
│   │   │       ├── repository.py
│   │   │       ├── providers/        # Payment gateways
│   │   │       │   ├── stripe.py
│   │   │       │   └── paypal.py
│   │   │       └── schemas.py
│   │   │
│   │   ├── ai/                       # AI & Intelligence layer
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── assistant/            # WeaverAssistant
│   │   │   │   ├── __init__.py
│   │   │   │   ├── weaver.py         # Main WeaverAssistant class
│   │   │   │   ├── intent.py         # Intent classification
│   │   │   │   ├── context.py        # Conversation context
│   │   │   │   ├── memory.py         # Conversation memory
│   │   │   │   ├── personalization.py # User preferences
│   │   │   │   ├── modes/            # Assistant modes
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── dmc.py        # DMC mode
│   │   │   │   │   └── traveler.py   # Traveler mode
│   │   │   │   └── responses.py      # Response generation
│   │   │   │
│   │   │   ├── workflows/            # Workflow routing
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py         # Main workflow router
│   │   │   │   ├── dmc_workflows.py  # DMC-specific workflows
│   │   │   │   └── traveler_workflows.py # Traveler workflows
│   │   │   │
│   │   │   └── models.py             # AI-related models
│   │   │
│   │   ├── api/                      # API routes
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── v1/                   # API version 1
│   │   │   │   ├── __init__.py
│   │   │   │   │
│   │   │   │   ├── auth.py           # Authentication endpoints
│   │   │   │   │
│   │   │   │   ├── dmc/              # DMC-facing APIs
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── dashboard.py  # Dashboard data
│   │   │   │   │   ├── bookings.py   # Booking management
│   │   │   │   │   ├── travelers.py  # Traveler management
│   │   │   │   │   ├── analytics.py  # Analytics & reports
│   │   │   │   │   └── team.py       # Team management
│   │   │   │   │
│   │   │   │   ├── traveler/         # Traveler-facing APIs (public)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── discover.py   # Destination discovery
│   │   │   │   │   ├── search.py     # Service search
│   │   │   │   │   ├── booking.py    # Booking creation
│   │   │   │   │   └── support.py    # Support & help
│   │   │   │   │
│   │   │   │   ├── assistant/        # WeaverAssistant APIs
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── chat.py       # Chat endpoints
│   │   │   │   │   ├── conversations.py # Conversation management
│   │   │   │   │   └── preferences.py # User preferences
│   │   │   │   │
│   │   │   │   ├── flights.py        # Flight service APIs
│   │   │   │   ├── hotels.py         # Hotel service APIs
│   │   │   │   ├── transport.py      # Transport service APIs
│   │   │   │   ├── experiences.py    # Experience service APIs
│   │   │   │   └── payments.py       # Payment APIs
│   │   │   │
│   │   │   └── deps.py               # Shared dependencies
│   │   │
│   │   ├── reference/                # SQLite reference data
│   │   │   ├── __init__.py
│   │   │   ├── airports.db           # Airport reference database
│   │   │   ├── data/                 # Reference data files
│   │   │   │   ├── airports.json
│   │   │   │   ├── airlines.json
│   │   │   │   └── countries.json
│   │   │   └── loader.py             # Load data into SQLite
│   │   │
│   │   └── utils/                    # Utility functions
│   │       ├── __init__.py
│   │       ├── dates.py              # Date utilities
│   │       ├── validators.py         # Validation utilities
│   │       └── formatters.py         # Formatting utilities
│   │
│   ├── tests/                        # Test suite
│   │   ├── __init__.py
│   │   ├── conftest.py               # Pytest configuration
│   │   ├── unit/                     # Unit tests
│   │   │   ├── services/
│   │   │   └── ai/
│   │   ├── integration/              # Integration tests
│   │   └── e2e/                      # End-to-end tests
│   │
│   ├── alembic/                      # Database migrations (optional)
│   │   └── versions/
│   │
│   ├── requirements.txt              # Python dependencies
│   ├── requirements-dev.txt          # Development dependencies
│   └── run.py                        # Entry point script
│
├── frontend/                         # Frontend applications
│   │
│   ├── dmc-portal/                   # DMC dashboard (Next.js)
│   │   ├── app/                      # Next.js 15 app directory
│   │   ├── components/               # React components
│   │   ├── lib/                      # Utilities
│   │   ├── public/                   # Static assets
│   │   ├── styles/                   # Global styles
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   ├── traveler-portal/              # Public traveler interface
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── styles/
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   └── shared/                       # Shared components & utilities
│       ├── components/               # Reusable UI components
│       ├── hooks/                    # Custom React hooks
│       ├── lib/                      # Shared utilities
│       └── types/                    # TypeScript types
│
├── deploy/                           # Deployment configurations
│   ├── systemd/
│   │   ├── travelweaver-api.service
│   │   └── travelweaver-frontend.service
│   ├── nginx/
│   │   ├── api.conf
│   │   └── frontend.conf
│   └── scripts/
│       ├── deploy.sh
│       ├── backup.sh
│       └── restore.sh
│
└── docs/                             # Documentation
    ├── API.md                        # API documentation
    ├── ARCHITECTURE.md               # This file
    ├── DATABASE.md                   # Database schemas
    ├── DEPLOYMENT.md                 # Deployment guide
    └── DEVELOPMENT.md                # Development guide
```

---

## 🎭 User Roles & Permissions

### Role Hierarchy

```
SuperAdmin (System Owner)
    ↓
DMC Admin (Organization Owner)
    ↓
DMC Manager (Can manage bookings, team)
    ↓
DMC Agent (Can create/view bookings)
    ↓
Traveler (Public user)
```

### Permission Matrix

| Feature | SuperAdmin | DMC Admin | DMC Manager | DMC Agent | Traveler |
|---------|------------|-----------|-------------|-----------|----------|
| Create booking | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all bookings | ✓ | ✓ (own org) | ✓ (own org) | ✓ (assigned) | ✓ (own) |
| Modify booking | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| Cancel booking | ✓ | ✓ | ✓ | ✓ | ✓ (own) |
| Manage team | ✓ | ✓ | ✓ | ✗ | ✗ |
| View analytics | ✓ | ✓ | ✓ | ✗ | ✗ |
| Configure services | ✓ | ✓ | ✗ | ✗ | ✗ |
| System settings | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## 🔐 Authentication & Authorization

### JWT-Based Authentication

```python
# Token structure
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "dmc_admin",
  "organization_id": "507f1f77bcf86cd799439012",
  "permissions": ["booking.create", "booking.view", ...],
  "exp": 1704067200,
  "iat": 1704063600
}
```

### OAuth2 Flow

```
1. User login → POST /api/v1/auth/login
2. Verify credentials → MongoDB query
3. Generate JWT token
4. Return token + refresh token
5. Client stores token
6. Include token in Authorization header
7. Server validates token on each request
```

---

## 🌐 API Design Principles

### RESTful Conventions

- **Resources**: Plural nouns (`/bookings`, `/flights`)
- **Actions**: HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- **Versioning**: URL path (`/api/v1/...`)
- **Filtering**: Query params (`?status=confirmed&date_from=2025-01-01`)
- **Pagination**: Query params (`?page=1&limit=20`)
- **Sorting**: Query params (`?sort=-created_at`)

### Response Format

```json
{
  "success": true,
  "data": {...} or [...],
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking with ID 123 not found",
    "details": {...}
  }
}
```

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | <500ms | New Relic/DataDog |
| Database Query Time | <100ms | MongoDB profiler |
| Page Load Time | <2s | Lighthouse |
| AI Intent Classification | <200ms | Custom metrics |
| Concurrent Users | 1000+ | Load testing |
| Uptime | 99.9% | Monitoring |

---

## 🔄 Service Communication

### Synchronous (REST)
- Frontend ↔ API Gateway
- API Gateway ↔ Services
- Services ↔ External APIs (Amadeus)

### Event-Driven (Future)
- Booking created → Email notification
- Payment received → Booking confirmation
- Cancellation → Refund processing

---

## 📈 Scalability Strategy

### Horizontal Scaling
- Multiple API server instances (Nginx load balancer)
- MongoDB replica set (when needed)
- Redis for session storage (when needed)

### Vertical Scaling
- Optimize database queries
- Add database indexes
- Cache frequently accessed data

---

## 🛡️ Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: RBAC with fine-grained permissions
3. **Data Encryption**: HTTPS for all communication
4. **Input Validation**: Pydantic models
5. **SQL Injection**: Parameterized queries (SQLite)
6. **NoSQL Injection**: MongoDB query sanitization
7. **Rate Limiting**: FastAPI rate limiter
8. **CORS**: Configured for specific origins
9. **Secrets Management**: Environment variables
10. **Audit Logging**: Track all sensitive operations

---

## 📝 Next Steps

After reviewing this architecture:

1. **Database Schemas** - Detailed MongoDB collections & SQLite tables
2. **API Contracts** - Complete endpoint specifications
3. **Data Models** - Pydantic models for all entities
4. **Service Interfaces** - Detailed service method signatures
5. **Deployment Plan** - Step-by-step deployment on your Linux server

---

**Questions for Review:**

1. Does this structure align with your vision?
2. Any services we should add/remove?
3. Any concerns about the architecture?
4. Ready to proceed to database schema design?
