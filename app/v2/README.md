# TravelWeaver V2 - Service-Oriented Architecture

TravelWeaver V2 is a complete rewrite of the travel booking platform using a modern service-oriented architecture with AI-powered features.

## Architecture Overview

### Backend Stack
- **FastAPI** - Modern Python web framework
- **MongoDB** - Dynamic data storage (users, bookings, travelers, conversations)
- **SQLite** - Static reference data (airports, airlines, countries)
- **Pydantic** - Data validation and serialization
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Frontend Stack
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Monochromatic Design** - Black & white design system
- **CSS Variables** - Consistent theming

## Setup Instructions

### Prerequisites

1. **Python 3.11+**
   ```bash
   python --version  # Should be 3.11 or higher
   ```

2. **MongoDB** (Required for full functionality)
   ```bash
   # Install MongoDB
   # Ubuntu/Debian
   sudo apt-get install -y mongodb-org
   
   # macOS
   brew install mongodb-community
   
   # Start MongoDB
   sudo systemctl start mongod  # Linux
   brew services start mongodb-community  # macOS
   
   # Verify MongoDB is running
   mongosh --eval "db.version()"
   ```

3. **Node.js 18+** (for frontend)
   ```bash
   node --version  # Should be 18 or higher
   ```

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd /home/user/weaver-v1
   pip install -r requirements-v2.txt
   ```

2. **Configure Environment Variables**
   
   Create `.env` file in project root:
   ```bash
   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017/travelweaver
   MONGODB_DATABASE=travelweaver
   
   # JWT Configuration
   JWT_SECRET_KEY=your-secret-key-change-in-production-32chars-minimum
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=30
   
   # Environment
   ENVIRONMENT=development
   DEBUG=true
   ```

3. **Start Backend Server**
   ```bash
   python -m uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

   Server will be available at: `http://localhost:8000`
   API Docs: `http://localhost:8000/api/docs`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment Variables**
   
   Create `frontend/.env.local`:
   ```bash
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   
   # App Configuration
   NEXT_PUBLIC_APP_NAME=TravelWeaver V2
   NEXT_PUBLIC_APP_DESCRIPTION=AI-Powered DMC Platform
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

## API Endpoints

### V2 Authentication
- `POST /api/v2/auth/register` - Register new user
- `POST /api/v2/auth/login` - Login and get JWT tokens
- `POST /api/v2/auth/refresh` - Refresh access token

### V2 Travelers
- `GET /api/v2/travelers` - List all travelers (paginated)
- `GET /api/v2/travelers/{id}` - Get traveler details
- `POST /api/v2/travelers` - Create new traveler
- `PATCH /api/v2/travelers/{id}` - Update traveler
- `DELETE /api/v2/travelers/{id}` - Delete traveler

### V2 Bookings
- `GET /api/v2/bookings` - List all bookings (paginated)
- `GET /api/v2/bookings/{id}` - Get booking details
- `POST /api/v2/bookings` - Create new booking
- `PATCH /api/v2/bookings/{id}` - Update booking
- `POST /api/v2/bookings/{id}/cancel` - Cancel booking

## User Roles & Permissions

### Roles
1. **system_admin** - Full system access
2. **dmc_admin** - Organization admin access
3. **dmc_manager** - Manager-level access
4. **dmc_staff** - Staff-level access
5. **traveler** - Traveler portal access

### Permissions
- `organization:read`, `organization:write`
- `users:read`, `users:write`
- `bookings:read`, `bookings:write`
- `travelers:read`, `travelers:write`
- `reports:read`, `reports:write`
- `automation:read`, `automation:write`
- `settings:read`, `settings:write`

## Database Schema

### MongoDB Collections

**users**
- Authentication and user profiles
- Fields: email, password_hash, full_name, role, organization_id, permissions

**organizations**
- DMC organizations
- Fields: name, slug, settings, branding

**bookings**
- Trip bookings
- Fields: booking_code, traveler_id, trip, services, pricing, payment, status

**travelers**
- Traveler profiles
- Fields: name, email, phone, passport, preferences, travel_history

**conversations**
- AI assistant conversations
- Fields: user_id, messages, context

**payments**
- Payment transactions
- Fields: booking_id, amount, status, method

### SQLite Tables

**airports**
- IATA/ICAO codes, names, locations

**airlines**
- Airline information

**countries**
- Country reference data

**currencies**
- Currency codes and exchange rates

## Development Notes

### Known Limitations (No MongoDB)
If MongoDB is not available, the server will start with limited functionality:
- Authentication endpoints will not work
- Traveler and booking endpoints will not work
- Only V1 endpoints and static features will function

### Frontend Routing
- Default route `/` redirects to `/v2/auth/login`
- DMC portal at `/v2/dmc/*`
- Authentication at `/v2/auth/*`

### Design System
- Monochromatic (black & white only)
- Typography: EB Garamond (headings), Geist (body), Geist Mono (code)
- CSS variables in `frontend/src/v2/styles/globals.css`

## Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with coverage
pytest --cov=app/v2
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

See `DEPLOYMENT.md` for production deployment instructions.

## Support

For issues or questions, please create an issue in the repository.
