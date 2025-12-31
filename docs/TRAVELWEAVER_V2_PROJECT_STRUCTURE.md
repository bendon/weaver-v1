# TravelWeaver 2.0 - Complete Project Structure

**Version**: 2.0
**Date**: 2025-12-31
**Status**: Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Structure](#backend-structure)
3. [Frontend Structure](#frontend-structure)
4. [Shared Resources](#shared-resources)
5. [Configuration Files](#configuration-files)
6. [Documentation](#documentation)

---

## Overview

### Repository Structure

```
travelweaver-v2/
├── backend/              # FastAPI backend application
├── frontend/             # Next.js frontend application
├── docs/                 # Documentation
├── scripts/              # Deployment and utility scripts
└── README.md
```

---

## Backend Structure

### Complete Backend Directory Tree

```
backend/
├── app/
│   ├── __init__.py
│   │
│   ├── api/                          # API layer
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app initialization
│   │   ├── dependencies.py           # Shared dependencies
│   │   │
│   │   └── routes/                   # API route handlers
│   │       ├── __init__.py
│   │       ├── auth.py               # Authentication endpoints
│   │       ├── users.py              # User management
│   │       ├── organizations.py      # Organization management
│   │       ├── bookings.py           # Booking endpoints (DMC)
│   │       ├── travelers.py          # Traveler endpoints (DMC)
│   │       ├── payments.py           # Payment endpoints
│   │       ├── flights.py            # Flight service endpoints
│   │       ├── hotels.py             # Hotel service endpoints
│   │       ├── transport.py          # Transport service endpoints
│   │       ├── experiences.py        # Experience service endpoints
│   │       ├── assistant.py          # WeaverAssistant endpoints
│   │       ├── traveler_portal.py    # Traveler portal endpoints
│   │       └── public.py             # Public endpoints (no auth)
│   │
│   ├── models/                       # Pydantic models
│   │   ├── __init__.py
│   │   ├── base.py                   # Base model classes
│   │   ├── user.py                   # User models
│   │   ├── organization.py           # Organization models
│   │   ├── traveler.py               # Traveler models
│   │   ├── flight.py                 # Flight models
│   │   ├── hotel.py                  # Hotel models
│   │   ├── transport.py              # Transport models
│   │   ├── experience.py             # Experience models
│   │   ├── booking.py                # Booking models
│   │   ├── payment.py                # Payment models
│   │   └── conversation.py           # Conversation models
│   │
│   ├── services/                     # Business logic services
│   │   ├── __init__.py
│   │   ├── base.py                   # Base service class
│   │   ├── flight_service.py         # Flight operations
│   │   ├── hotel_service.py          # Hotel operations
│   │   ├── transport_service.py      # Transport operations
│   │   ├── experience_service.py     # Experience operations
│   │   ├── booking_service.py        # Booking orchestration
│   │   ├── traveler_service.py       # Traveler management
│   │   ├── payment_service.py        # Payment processing
│   │   ├── notification_service.py   # Email/SMS notifications
│   │   └── weaver_assistant_service.py # AI orchestration
│   │
│   ├── ai/                           # AI components
│   │   ├── __init__.py
│   │   │
│   │   └── hybrid/                   # Hybrid AI architecture
│   │       ├── __init__.py
│   │       ├── intent_classifier.py  # Intent classification (Claude Haiku)
│   │       └── conversation_manager.py # Conversation orchestration
│   │
│   ├── workflows/                    # Workflow routing
│   │   ├── __init__.py
│   │   └── workflow_router.py        # Intent-to-service routing
│   │
│   ├── core/                         # Core utilities
│   │   ├── __init__.py
│   │   ├── config.py                 # Configuration management
│   │   ├── security.py               # JWT, password hashing
│   │   ├── permissions.py            # RBAC permissions
│   │   ├── database.py               # Database connections
│   │   ├── logging_config.py         # Logging setup
│   │   └── exceptions.py             # Custom exceptions
│   │
│   ├── repositories/                 # Data access layer
│   │   ├── __init__.py
│   │   ├── base_repository.py        # Base repository
│   │   ├── user_repository.py        # User data access
│   │   ├── organization_repository.py # Organization data access
│   │   ├── booking_repository.py     # Booking data access
│   │   ├── traveler_repository.py    # Traveler data access
│   │   ├── payment_repository.py     # Payment data access
│   │   ├── conversation_repository.py # Conversation data access
│   │   └── reference_repository.py   # SQLite reference data
│   │
│   ├── integrations/                 # External API integrations
│   │   ├── __init__.py
│   │   ├── amadeus_client.py         # Amadeus API client
│   │   ├── email_client.py           # Email service client
│   │   └── sms_client.py             # SMS service client
│   │
│   ├── utils/                        # Utility functions
│   │   ├── __init__.py
│   │   ├── date_utils.py             # Date/time utilities
│   │   ├── string_utils.py           # String manipulation
│   │   ├── validation_utils.py       # Validation helpers
│   │   └── formatting_utils.py       # Data formatting
│   │
│   └── scripts/                      # Maintenance scripts
│       ├── __init__.py
│       ├── init_db.py                # Initialize databases
│       ├── seed_data.py              # Seed sample data
│       ├── migrate.py                # Database migrations
│       └── import_reference_data.py  # Import airports, airlines, etc.
│
├── tests/                            # Test suite
│   ├── __init__.py
│   ├── conftest.py                   # Pytest configuration
│   │
│   ├── unit/                         # Unit tests
│   │   ├── __init__.py
│   │   ├── test_services/
│   │   │   ├── test_flight_service.py
│   │   │   ├── test_hotel_service.py
│   │   │   ├── test_booking_service.py
│   │   │   └── test_traveler_service.py
│   │   ├── test_models/
│   │   │   ├── test_user_models.py
│   │   │   └── test_booking_models.py
│   │   └── test_utils/
│   │       └── test_validation_utils.py
│   │
│   ├── integration/                  # Integration tests
│   │   ├── __init__.py
│   │   ├── test_auth_flow.py
│   │   ├── test_booking_flow.py
│   │   └── test_assistant_flow.py
│   │
│   └── e2e/                          # End-to-end tests
│       ├── __init__.py
│       └── test_complete_booking.py
│
├── data/                             # Local data files
│   ├── reference.db                  # SQLite reference database
│   └── reference_data/               # CSV/JSON reference data
│       ├── airports.csv
│       ├── airlines.csv
│       ├── countries.csv
│       └── currencies.csv
│
├── logs/                             # Log files (gitignored)
│   ├── app.log
│   ├── access.log
│   └── error.log
│
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Example environment variables
├── .gitignore
├── requirements.txt                  # Python dependencies
├── requirements-dev.txt              # Development dependencies
├── pytest.ini                        # Pytest configuration
├── pyproject.toml                    # Project metadata
├── alembic.ini                       # Database migrations (if using Alembic)
└── README.md
```

### Key Backend Files

#### `app/api/main.py`

```python
"""
TravelWeaver 2.0 - FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.routes import (
    auth,
    users,
    organizations,
    bookings,
    travelers,
    payments,
    flights,
    hotels,
    transport,
    experiences,
    assistant,
    traveler_portal,
    public
)

# Setup logging
setup_logging()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="TravelWeaver 2.0 API - Service-oriented travel booking platform"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["Organizations"])
app.include_router(bookings.router, prefix="/api/v1/dmc/bookings", tags=["DMC - Bookings"])
app.include_router(travelers.router, prefix="/api/v1/dmc/travelers", tags=["DMC - Travelers"])
app.include_router(payments.router, prefix="/api/v1/dmc/payments", tags=["DMC - Payments"])
app.include_router(flights.router, prefix="/api/v1/services/flights", tags=["Services - Flights"])
app.include_router(hotels.router, prefix="/api/v1/services/hotels", tags=["Services - Hotels"])
app.include_router(transport.router, prefix="/api/v1/services/transport", tags=["Services - Transport"])
app.include_router(experiences.router, prefix="/api/v1/services/experiences", tags=["Services - Experiences"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["WeaverAssistant"])
app.include_router(traveler_portal.router, prefix="/api/v1/traveler", tags=["Traveler Portal"])
app.include_router(public.router, prefix="/api/v1/public", tags=["Public"])

# Health check
@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    """API root"""
    return {
        "message": "TravelWeaver 2.0 API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }
```

#### `app/core/config.py`

```python
"""
Configuration Management
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "TravelWeaver"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database - MongoDB
    MONGODB_URL: str
    MONGODB_DATABASE: str = "travelweaver"

    # Database - SQLite
    SQLITE_PATH: str = "./data/reference.db"

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # API Keys
    ANTHROPIC_API_KEY: str
    AMADEUS_API_KEY: str
    AMADEUS_API_SECRET: str
    AMADEUS_ENVIRONMENT: str = "test"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://app.travelweaver.com"
    ]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

#### `requirements.txt`

```txt
# FastAPI and server
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0
python-multipart==0.0.6

# Pydantic
pydantic==2.5.3
pydantic-settings==2.1.0

# Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4

# Database
pymongo==4.6.1

# AI
anthropic==0.8.1

# Integrations
amadeus==8.0.0

# Rate limiting
slowapi==0.1.9

# Email
python-dotenv==1.0.0
jinja2==3.1.2

# Utilities
python-dateutil==2.8.2

# Monitoring
sentry-sdk==1.39.2
```

---

## Frontend Structure

### Complete Frontend Directory Tree

```
frontend/
├── app/                              # Next.js 15 app directory
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   │
│   ├── (auth)/                       # Auth routes group
│   │   ├── login/
│   │   │   └── page.tsx              # Login page
│   │   ├── register/
│   │   │   └── page.tsx              # Register page
│   │   └── reset-password/
│   │       └── page.tsx              # Password reset
│   │
│   ├── (dmc)/                        # DMC portal routes
│   │   ├── layout.tsx                # DMC layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx              # DMC dashboard
│   │   ├── bookings/
│   │   │   ├── page.tsx              # Bookings list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Booking details
│   │   │   └── new/
│   │   │       └── page.tsx          # Create booking
│   │   ├── travelers/
│   │   │   ├── page.tsx              # Travelers list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Traveler details
│   │   │   └── new/
│   │   │       └── page.tsx          # Add traveler
│   │   ├── payments/
│   │   │   └── page.tsx              # Payments list
│   │   ├── assistant/
│   │   │   └── page.tsx              # WeaverAssistant chat
│   │   ├── settings/
│   │   │   ├── page.tsx              # Settings overview
│   │   │   ├── organization/
│   │   │   │   └── page.tsx          # Organization settings
│   │   │   ├── users/
│   │   │   │   └── page.tsx          # User management
│   │   │   └── branding/
│   │   │       └── page.tsx          # Branding settings
│   │   └── analytics/
│   │       └── page.tsx              # Analytics dashboard
│   │
│   ├── (traveler)/                   # Traveler portal routes
│   │   ├── layout.tsx                # Traveler layout
│   │   ├── my-trips/
│   │   │   └── page.tsx              # My trips list
│   │   ├── trip/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Trip details
│   │   ├── profile/
│   │   │   └── page.tsx              # Traveler profile
│   │   └── chat/
│   │       └── [orgSlug]/
│   │           └── page.tsx          # Public chat with DMC
│   │
│   └── api/                          # API routes (if needed)
│       └── health/
│           └── route.ts              # Health check
│
├── src/
│   ├── components/                   # React components
│   │   ├── ui/                       # UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ...
│   │   │
│   │   ├── forms/                    # Form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   ├── TravelerForm.tsx
│   │   │   └── ...
│   │   │
│   │   ├── bookings/                 # Booking components
│   │   │   ├── BookingCard.tsx
│   │   │   ├── BookingList.tsx
│   │   │   ├── BookingDetails.tsx
│   │   │   ├── FlightSection.tsx
│   │   │   ├── HotelSection.tsx
│   │   │   └── ...
│   │   │
│   │   ├── travelers/                # Traveler components
│   │   │   ├── TravelerCard.tsx
│   │   │   ├── TravelerList.tsx
│   │   │   └── TravelerProfile.tsx
│   │   │
│   │   ├── assistant/                # AI Assistant components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── SuggestedActions.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── RecentBookings.tsx
│   │   │   └── ...
│   │   │
│   │   └── layout/                   # Layout components
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── lib/                          # Utilities and helpers
│   │   ├── api.ts                    # API client
│   │   ├── auth.ts                   # Authentication helpers
│   │   ├── utils.ts                  # General utilities
│   │   ├── formatters.ts             # Data formatters
│   │   └── validators.ts             # Form validators
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useBookings.ts            # Bookings data hook
│   │   ├── useTravelers.ts           # Travelers data hook
│   │   ├── useAssistant.ts           # AI assistant hook
│   │   └── useDebounce.ts            # Debounce hook
│   │
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.tsx           # Authentication context
│   │   ├── OrganizationContext.tsx   # Organization context
│   │   └── ThemeContext.tsx          # Theme context
│   │
│   ├── types/                        # TypeScript types
│   │   ├── api.ts                    # API response types
│   │   ├── user.ts                   # User types
│   │   ├── booking.ts                # Booking types
│   │   ├── traveler.ts               # Traveler types
│   │   └── ...
│   │
│   └── styles/                       # Styles
│       ├── globals.css               # Global styles (Tailwind)
│       └── ...
│
├── public/                           # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── hero.jpg
│   │   └── ...
│   ├── icons/
│   │   └── ...
│   └── fonts/
│       └── ...
│
├── .env.local                        # Environment variables (gitignored)
├── .env.example                      # Example environment variables
├── .gitignore
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
├── pnpm-lock.yaml                    # pnpm lockfile
└── README.md
```

### Key Frontend Files

#### `src/lib/api.ts`

```typescript
/**
 * API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

interface RequestOptions extends RequestInit {
  requireAuth?: boolean
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  // Add auth token if required
  if (requireAuth) {
    const token = localStorage.getItem('access_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    }),

  // Bookings
  getBookings: (params?: Record<string, any>) =>
    request(`/dmc/bookings?${new URLSearchParams(params)}`),

  getBooking: (id: string) =>
    request(`/dmc/bookings/${id}`),

  createBooking: (data: any) =>
    request('/dmc/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ... more API methods
}
```

#### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-subtle': 'var(--color-bg-subtle)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif: ['EB Garamond', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
```

#### `package.json`

```json
{
  "name": "travelweaver-frontend",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Shared Resources

### Documentation Structure

```
docs/
├── TRAVELWEAVER_V2_ARCHITECTURE.md       # System architecture
├── TRAVELWEAVER_V2_DATABASE.md           # Database schemas
├── TRAVELWEAVER_V2_API.md                # API specification
├── TRAVELWEAVER_V2_SERVICES.md           # Service layer design
├── TRAVELWEAVER_V2_MODELS.md             # Data models (Pydantic)
├── TRAVELWEAVER_V2_AUTH.md               # Authentication & authorization
├── TRAVELWEAVER_V2_DEPLOYMENT.md         # Deployment guide
├── TRAVELWEAVER_V2_PROJECT_STRUCTURE.md  # This file
│
├── guides/
│   ├── getting-started.md                # Getting started guide
│   ├── api-guide.md                      # API usage guide
│   ├── contributing.md                   # Contribution guidelines
│   └── troubleshooting.md                # Common issues
│
└── diagrams/
    ├── architecture.png
    ├── database-schema.png
    └── deployment.png
```

### Scripts Structure

```
scripts/
├── setup/
│   ├── install-dependencies.sh           # Install all dependencies
│   ├── setup-databases.sh                # Setup MongoDB and SQLite
│   └── generate-secrets.sh               # Generate secret keys
│
├── deployment/
│   ├── deploy-backend.sh                 # Deploy backend
│   ├── deploy-frontend.sh                # Deploy frontend
│   └── rollback.sh                       # Rollback deployment
│
├── backup/
│   ├── backup-mongo.sh                   # Backup MongoDB
│   ├── backup-sqlite.sh                  # Backup SQLite
│   └── restore.sh                        # Restore backups
│
└── maintenance/
    ├── update-reference-data.sh          # Update airports, airlines, etc.
    ├── cleanup-logs.sh                   # Clean old logs
    └── health-check.sh                   # Check system health
```

---

## Configuration Files

### Root Configuration Files

#### `.gitignore`

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Node
node_modules/
.next/
out/
build/
dist/

# Environment
.env
.env.local
.env.production

# Logs
logs/
*.log

# Databases
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Backups
backups/
*.backup

# Temporary files
tmp/
temp/
```

#### Root `README.md`

```markdown
# TravelWeaver 2.0

Service-oriented travel booking platform with AI-powered assistance.

## Features

- **DMC Portal**: Complete booking management for travel agencies
- **Traveler Portal**: Self-service booking and trip management
- **WeaverAssistant**: AI-powered conversational booking assistant
- **Multi-Service**: Flights, hotels, transport, and experiences
- **Hybrid AI**: Code for logic, AI for conversation (70-90% cost reduction)

## Architecture

- **Backend**: FastAPI + Python 3.11+
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Databases**: MongoDB (dynamic data) + SQLite (reference data)
- **AI**: Claude Haiku (intent classification and conversation)
- **APIs**: Amadeus (flights, hotels)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB 6.0+
- Git

### Installation

1. Clone repository
2. Setup backend
3. Setup frontend
4. Configure environment variables
5. Initialize databases
6. Start services

See [Getting Started Guide](docs/guides/getting-started.md) for details.

## Documentation

- [Architecture](docs/TRAVELWEAVER_V2_ARCHITECTURE.md)
- [API Specification](docs/TRAVELWEAVER_V2_API.md)
- [Deployment Guide](docs/TRAVELWEAVER_V2_DEPLOYMENT.md)
- [Contributing](docs/guides/contributing.md)

## License

Proprietary - All rights reserved
```

---

**End of Project Structure**

This document provides the complete file and directory structure for TravelWeaver 2.0, ready for implementation.
