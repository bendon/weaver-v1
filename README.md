# ItineraryWeaver PoC

A proof-of-concept application for compiling travel itineraries from multiple sources (Amadeus API, hotels, transfers, activities) into branded, shareable formats.

## Features

- 🔌 **Amadeus API Integration** - Search and book flights via Amadeus test environment
- 📋 **Itinerary Compilation** - Combine flights, hotels, transfers, and activities into structured itineraries
- 📱 **WhatsApp Formatting** - Generate WhatsApp-friendly itinerary messages
- 🌐 **HTML Export** - Create beautiful HTML itinerary documents
- 🎨 **Custom Branding** - Brand itineraries with company colors, logos, and contact info
- 📊 **JSON Export** - Export itinerary data as JSON for API integration

## Project Structure

```
BUMBA/
├── app/
│   ├── __init__.py
│   ├── models.py              # Data models (Traveler, Flight, Hotel, etc.)
│   ├── schemas.py              # Pydantic schemas for API validation
│   ├── database.py             # SQLite database module
│   ├── amadeus_client.py      # Amadeus API client
│   ├── itinerary_compiler.py  # Itinerary compilation and formatting
│   ├── api.py                 # FastAPI REST API endpoints
│   └── demo.py                # Demo script
├── data/                      # SQLite database (created on first run)
│   └── itineraries.db         # Database file
├── output/                    # Generated outputs (created on first run)
├── .env                       # API credentials (gitignored)
├── .env.example              # Example environment file
├── requirements.txt          # Python dependencies
├── main.py                   # API server entry point
└── README.md                 # This file
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API credentials:**
   - Copy `.env.example` to `.env` (already done)
   - Or set environment variables:
     - `AMADEUS_API_KEY`
     - `AMADEUS_API_SECRET`

3. **Run the demo:**
   ```bash
   python -m app.demo
   ```

4. **Test Amadeus API integration:**
   ```bash
   python -m app.demo --amadeus
   ```

5. **Start the REST API server:**
   ```bash
   python main.py
   ```
   The API will be available at `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Alternative docs: `http://localhost:8000/redoc`

## Usage

### REST API Server

Start the FastAPI server:

```bash
python main.py
```

The API will be available at `http://localhost:8000` with:
- **Interactive API docs:** `http://localhost:8000/docs` (Swagger UI)
- **Alternative docs:** `http://localhost:8000/redoc` (ReDoc)
- **Health check:** `http://localhost:8000/health`

#### API Endpoints

**POST `/api/itineraries/compile`**
- Compile travel components into a structured itinerary
- Request body: `CompileItineraryRequest` (see schemas)
- Returns: `ItineraryResponse` with compiled itinerary

**POST `/api/itineraries/{itinerary_id}/format/{format_type}`**
- Get itinerary in specific format (whatsapp, html, json)
- Request body: `CompileItineraryRequest`
- Returns: `FormatResponse` with formatted content

**POST `/api/flights/search`**
- Search for flights using Amadeus API
- Request body: `FlightSearchRequest`
- Returns: `FlightSearchResponse` with flight offers

**GET `/api/amadeus/test`**
- Test Amadeus API connection
- Returns: Connection status

**GET `/health`**
- Health check endpoint
- Returns: API status and Amadeus connection status

#### Example API Request

```bash
# Compile an itinerary
curl -X POST "http://localhost:8000/api/itineraries/compile" \
  -H "Content-Type: application/json" \
  -d '{
    "reference_number": "BOOK-001",
    "title": "My Trip",
    "travelers": [...],
    "flights": [...],
    "hotels": [...]
  }'

# Search flights
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

### Basic Demo

Run the demo script to see a complete Kenya safari itinerary:

```bash
python -m app.demo
```

This will:
- Create sample booking data (flights, hotels, transfers, activities)
- Compile into a structured itinerary
- Generate WhatsApp message
- Export HTML and JSON files to `output/` directory

### Amadeus API Integration

Test the Amadeus API connection:

```bash
python -m app.demo --amadeus
```

### Programmatic Usage

```python
from app.models import *
from app.itinerary_compiler import ItineraryCompiler, ItineraryFormatter
from app.amadeus_client import AmadeusClient

# Create branding
branding = ItineraryBranding(
    company_name="My Travel Agency",
    primary_color="#1E88E5",
    contact_email="info@agency.com"
)

# Compile itinerary
compiler = ItineraryCompiler(branding=branding)
itinerary = compiler.compile(
    reference_number="BOOK-001",
    title="My Trip",
    travelers=[...],
    flights=[...],
    hotels=[...],
    transfers=[...],
    activities=[...]
)

# Generate outputs
whatsapp_msg = ItineraryFormatter.to_whatsapp_message(itinerary)
html_content = ItineraryFormatter.to_html(itinerary)
json_data = ItineraryFormatter.to_json(itinerary)
```

## Amadeus API

This project uses the Amadeus for Developers API (test environment).

- **Documentation:** https://developers.amadeus.com/
- **Postman Collection:** https://www.postman.com/amadeus4dev/amadeus-for-developers-s-public-workspace/collection/kquqijj/amadeus-for-developers
- **My Apps Portal:** https://developers.amadeus.com/my-apps
- **API Endpoints Used:**
  - Flight Offers Search (`/v2/shopping/flight-offers`)
  - Hotel Offers Search (`/v3/shopping/hotel-offers`)
  - Airport Information (`/v1/reference-data/locations`)

### Getting API Credentials

1. **Create an Amadeus Developer Account:**
   - Go to https://developers.amadeus.com/
   - Sign up for a free account

2. **Create a New App:**
   - Navigate to "My Self-Service Workspace"
   - Click "Create New App"
   - Choose "Test" environment
   - Copy your API Key and API Secret

3. **Activate Your App:**
   - Make sure your app status is "Active"
   - Wait a few minutes after creation for activation

4. **Update Credentials:**
   - Update `.env` file with your API Key and Secret
   - Or set environment variables

### Troubleshooting Authentication Errors

If you get a `401 Unauthorized` or `invalid_client` error:

- **Verify credentials** in https://developers.amadeus.com/my-apps
- **Check app status** - must be "Active"
- **Ensure test environment** credentials (not production)
- **Wait for activation** - new apps may take a few minutes
- **Verify no extra spaces** when copying credentials

Run the diagnostic script for detailed error information:
```bash
python test_amadeus_auth.py
```

## Output Formats

### WhatsApp Message
Plain text format optimized for WhatsApp with emojis and clear structure.

### HTML Document
Fully styled HTML document with:
- Branded header
- Organized sections (Flights, Hotels, Daily Itinerary)
- Responsive design
- Company footer

### JSON
Structured JSON data for API integration or further processing.

## Data Models

- **Traveler** - Passenger information
- **FlightBooking** - Flight reservations with segments
- **HotelReservation** - Hotel bookings
- **Transfer** - Ground transportation
- **Activity** - Tours, excursions, experiences
- **Itinerary** - Compiled travel plan
- **ItineraryBranding** - Branding configuration

## Development

### Adding New Components

1. Add model to `app/models.py`
2. Update `ItineraryCompiler.compile()` to handle new component
3. Update formatters to include new component in outputs

### Extending Amadeus Integration

Add new methods to `AmadeusClient` class in `app/amadeus_client.py`:

```python
def search_cars(self, ...):
    endpoint = "/v1/shopping/car-offers"
    # Implementation
```

## License

This is a proof-of-concept project for demonstration purposes.

## Notes

- Uses Amadeus **test environment** - no real bookings are made
- Sample data is hardcoded in `demo.py` for demonstration
- Production use would require proper error handling, validation, and security measures

