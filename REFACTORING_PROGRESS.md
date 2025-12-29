# TravelWeaver Platform Refactoring Progress

## Overview

This document tracks the progress of refactoring the TravelWeaver project to match the complete specification (v2.0).

## Completed ✅

### 1. Project Structure
- ✅ Created new directory structure:
  - `app/core/` - Core configuration, security, database
  - `app/api/routes/` - API route modules
  - `app/services/` - Service layer (to be created)
  - `app/models/` - Data models (to be created)
  - `app/schemas/` - Pydantic schemas (to be organized)

### 2. Core Configuration
- ✅ `app/core/config.py` - Centralized settings using Pydantic Settings
- ✅ `app/core/security.py` - Security utilities (JWT, password hashing with bcrypt)
- ✅ `app/core/database.py` - Complete database schema implementation

### 3. Database Schema
- ✅ Complete SQLite schema matching specification:
  - Organizations, Users, Travelers
  - Bookings, Booking_Travelers (many-to-many)
  - Flights, Hotels, Transfers, Activities
  - Flight Changes (audit log)
  - Messages, Scheduled Messages
  - Automation Rules
  - Conversations, Conversation Messages
  - Reference Data (Airports, Airlines)
  - Views: v_active_bookings, v_flights_to_monitor, v_pending_scheduled_messages
  - Triggers for updated_at timestamps

### 4. Dependencies
- ✅ Updated `requirements.txt` with new dependencies:
  - pydantic-settings
  - bcrypt
  - httpx
  - anthropic (for Claude AI)
  - apscheduler (for background tasks)

### 5. API Dependencies
- ✅ `app/api/deps.py` - API dependency injection helpers

## In Progress 🔄

### Database Functions
- 🔄 Migrating database helper functions from old `database.py` to new structure
- 🔄 Need to update all database access to use new schema

## Remaining Tasks 📋

### High Priority

1. **Service Layer** (`app/services/`)
   - [ ] `amadeus_service.py` - Refactor Amadeus client into service
   - [ ] `whatsapp_service.py` - 360dialog integration
   - [ ] `llm_service.py` - Claude/Anthropic integration for AI assistant
   - [ ] `automation_service.py` - Automation engine
   - [ ] `flight_monitor_service.py` - Flight monitoring with polling
   - [ ] `itinerary_service.py` - Itinerary compilation
   - [ ] `notification_service.py` - Message delivery

2. **API Routes** (`app/api/routes/`)
   - [ ] `auth.py` - Authentication endpoints
   - [ ] `bookings.py` - Booking management
   - [ ] `travelers.py` - Traveler management
   - [ ] `flights.py` - Flight operations
   - [ ] `chat.py` - AI booking assistant chat
   - [ ] `public.py` - Public itinerary access
   - [ ] `webhooks.py` - WhatsApp webhooks

3. **Models** (`app/models/`)
   - [ ] SQLAlchemy models matching new schema
   - [ ] Migration from dataclasses to ORM

4. **Schemas** (`app/schemas/`)
   - [ ] Update Pydantic schemas to match new API spec
   - [ ] Request/Response models for all endpoints

5. **Main Application**
   - [ ] Refactor `app/api.py` to use new route modules
   - [ ] Update `main.py` entry point
   - [ ] Background task setup (APScheduler)

### Medium Priority

6. **AI Booking Assistant**
   - [ ] Claude integration with tool calling
   - [ ] Conversation state management
   - [ ] Tool definitions (search_flights, create_draft_itinerary, etc.)

7. **WhatsApp Integration**
   - [ ] 360dialog API client
   - [ ] Template message handling
   - [ ] Webhook processing
   - [ ] Traveler Q&A flow

8. **Automation Engine**
   - [ ] Trigger system
   - [ ] Message scheduler
   - [ ] Template personalization
   - [ ] DMC configuration UI

9. **Flight Monitoring**
   - [ ] Polling scheduler
   - [ ] Change detection
   - [ ] Alert generation
   - [ ] Status updates

### Low Priority

10. **Testing & Documentation**
    - [ ] Unit tests
    - [ ] Integration tests
    - [ ] API documentation updates
    - [ ] Deployment guide

## Migration Notes

### Database Migration
- Old database: `data/itineraries.db`
- New database: `data/travelweaver.db` (per spec)
- Need to migrate existing data if any

### Breaking Changes
- Database schema completely changed
- API structure will change (routes in separate modules)
- Authentication uses bcrypt instead of SHA-256
- New environment variables required

## Next Steps

1. **Complete Database Migration**
   - Move all database helper functions to new structure
   - Update all imports

2. **Create Service Layer**
   - Start with Amadeus service (refactor existing client)
   - Create WhatsApp service
   - Create LLM service for AI assistant

3. **Refactor API Routes**
   - Split `app/api.py` into route modules
   - Update to use new services
   - Add new endpoints per spec

4. **Implement New Features**
   - AI Booking Assistant
   - WhatsApp integration
   - Automation engine
   - Flight monitoring

## Environment Variables Needed

```bash
# Database
DATABASE_URL=sqlite:///./data/travelweaver.db

# Amadeus
AMADEUS_CLIENT_ID=xxx
AMADEUS_CLIENT_SECRET=xxx
AMADEUS_BASE_URL=https://test.api.amadeus.com

# WhatsApp (360dialog)
WHATSAPP_API_KEY=xxx
WHATSAPP_WEBHOOK_SECRET=xxx

# LLM (Claude)
ANTHROPIC_API_KEY=xxx

# Weather
OPENWEATHER_API_KEY=xxx

# SMS (Africa's Talking)
AT_USERNAME=xxx
AT_API_KEY=xxx

# App
SECRET_KEY=xxx
FRONTEND_URL=http://localhost:3000
PUBLIC_URL=http://localhost:3000
```

## File Structure (Target)

```
app/
├── __init__.py
├── core/
│   ├── __init__.py
│   ├── config.py ✅
│   ├── security.py ✅
│   └── database.py ✅
├── models/
│   └── (SQLAlchemy models - TODO)
├── services/
│   ├── __init__.py
│   ├── amadeus_service.py (TODO)
│   ├── whatsapp_service.py (TODO)
│   ├── llm_service.py (TODO)
│   ├── automation_service.py (TODO)
│   ├── flight_monitor_service.py (TODO)
│   ├── itinerary_service.py (TODO)
│   └── notification_service.py (TODO)
├── api/
│   ├── __init__.py ✅
│   ├── deps.py ✅
│   ├── main.py (TODO - refactor from api.py)
│   └── routes/
│       ├── __init__.py
│       ├── auth.py (TODO)
│       ├── bookings.py (TODO)
│       ├── travelers.py (TODO)
│       ├── flights.py (TODO)
│       ├── chat.py (TODO)
│       ├── public.py (TODO)
│       └── webhooks.py (TODO)
├── schemas/
│   └── (organized schemas - TODO)
└── (legacy files to be migrated/removed)
```

## Notes

- This is a major refactoring. The existing codebase has good foundations but needs restructuring.
- The specification is comprehensive - this will be a multi-phase implementation.
- Priority should be on core functionality first (database, services, basic API), then new features (AI, WhatsApp, automation).

