# WeaverAssistant - Core Automation Framework

## Overview

WeaverAssistant is TravelWeaver's AI-powered travel planning companion that uses a **99% algorithms / 1% AI** architecture. The system uses pattern-based intent recognition to route user requests to your business logic automations, which execute and return template-formatted responses with actionable buttons.

## Architecture

```
User Input (Natural Language)
    ↓
[Intent Recognition - 1%] Pattern matching + keyword extraction
    ↓
[Automation Registry] Routes to appropriate automation
    ↓
[Automation Execution - 99%] Your business logic
    ↓
[Template Response] Formatted output with action buttons
    ↓
User sees structured response
```

## Core Automations

### 1. GreetingAutomation
**Intent**: `GREETING`
**Examples**: "Hello", "Hi", "Good morning"
**Function**: Welcome messages with quick action buttons

### 2. FlightSearchAutomation
**Intent**: `SEARCH_FLIGHT`
**Examples**: "Find flights to Cape Town tomorrow", "Search afternoon flights to Nairobi"
**Function**: Searches flights with filtering (time preference, class, direct only)
**Features**:
- Date parsing (tomorrow, today, next week)
- Time preference (morning, afternoon, evening)
- Flight class (economy, business, first)
- Direct flight filtering

### 3. HotelSearchAutomation
**Intent**: `SEARCH_HOTEL`
**Examples**: "Find luxury hotels in Zanzibar", "Search for budget accommodation"
**Function**: Searches hotels with category and amenity filtering
**Features**:
- Category filtering (luxury, standard, budget, boutique)
- Amenity matching (pool, spa, wifi)
- Duration calculation
- Pricing per night and total

### 4. ItineraryBuilderAutomation
**Intent**: `BUILD_ITINERARY`
**Examples**: "Plan a 7-day safari", "Build a beach vacation itinerary"
**Function**: Generates custom itineraries using your DMC templates
**Features**:
- Trip type templates (safari, beach, city, adventure)
- Day-by-day activity scheduling
- Accommodation selection by budget level
- Inclusions/exclusions lists
- Pricing calculation with breakdown
- Requires confirmation workflow

### 5. BookingCreationAutomation
**Intent**: `CREATE_BOOKING`
**Examples**: "Create a booking", "Book this itinerary"
**Function**: Creates bookings from conversation context
**Features**:
- Booking reference generation (WV-YYYYMMDD-XXXX)
- Multiple service types (itineraries, flights, hotels)
- Traveler validation
- Payment and document status tracking
- Next steps workflow

### 6. ViewBookingsAutomation
**Intent**: `VIEW_BOOKING`
**Examples**: "Show my bookings", "View active bookings"
**Function**: Queries and displays bookings with smart filtering
**Features**:
- Status filtering (active, pending, confirmed, completed)
- Destination filtering
- Date range filtering
- Summary statistics
- Service summaries

### 7. TravelerManagementAutomation
**Intent**: `VIEW_TRAVELER`
**Examples**: "List all travelers", "Find traveler John", "Show traveler details"
**Function**: Manages traveler information
**Features**:
- List all travelers in organization
- Search by name/email
- Detailed traveler profiles
- Travel preferences display

### 8. DestinationInfoAutomation
**Intent**: `GET_DESTINATION_INFO`
**Examples**: "Tell me about Kenya", "What's the best time to visit Tanzania?"
**Function**: Provides curated destination information
**Features**:
- Destination database (Kenya, Tanzania, South Africa, Uganda, Rwanda)
- Best time to visit
- Top highlights and activities
- Practical info (visa, currency, language, safety)
- Quick action buttons to plan trips

## Testing

### Quick Test
Run the automated test suite to verify all automations work:

```bash
python test_weaver_assistant.py
```

This tests all 8 automations without requiring database or API setup.

### Manual Testing via API

1. **Start the FastAPI server:**
```bash
cd /home/user/weaver-v1
uvicorn app.api.main:app --reload --port 8000
```

2. **Login to get auth token:**
```bash
curl -X POST "http://localhost:8000/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "your_email@example.com", "password": "your_password"}'
```

3. **Send a message:**
```bash
curl -X POST "http://localhost:8000/api/v2/assistant/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Find flights to Cape Town tomorrow"}'
```

### Testing via Frontend

1. Start the frontend (Next.js):
```bash
cd /home/user/weaver-v1/frontend
npm run dev
```

2. Navigate to: `http://localhost:3000/v2/auth/login`
3. Login with your credentials
4. Go to "AI Assistant" in the sidebar
5. Start chatting!

## API Endpoints

### Send Message
`POST /api/v2/assistant/chat`
```json
{
  "message": "Find flights to Cape Town",
  "conversation_id": "optional-conversation-id"
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "conv_123",
  "intent": {
    "type": "search_flight",
    "confidence": 0.9,
    "entities": {...}
  },
  "response": {
    "message": "Found 5 flights...",
    "template": "flight_results",
    "data": {...},
    "actions": [
      {"type": "button", "label": "Book Flight", "action": "book_flight"}
    ],
    "status": "success"
  }
}
```

### List Conversations
`GET /api/v2/assistant/conversations`

### Get Conversation
`GET /api/v2/assistant/conversations/{conversation_id}`

### Archive Conversation
`POST /api/v2/assistant/conversations/{conversation_id}/archive`

## Intent Recognition Patterns

The system uses keyword matching for intent recognition:

```python
PATTERNS = {
    "SEARCH_FLIGHT": ["flight", "fly", "plane", "ticket", "airline"],
    "SEARCH_HOTEL": ["hotel", "accommodation", "stay", "lodge"],
    "BUILD_ITINERARY": ["itinerary", "plan trip", "safari"],
    "VIEW_BOOKING": ["show booking", "my booking", "bookings"],
    "VIEW_TRAVELER": ["travelers", "list travelers", "find traveler"],
    "GET_DESTINATION_INFO": ["tell me about", "visit", "destination"],
    # ...
}
```

## Entity Extraction

Automatically extracts:
- **Dates**: tomorrow, today, next week, specific months
- **Locations**: destination names and airport codes
- **Numbers**: traveler count, duration in days/nights
- **Flight preferences**: time (morning/afternoon/evening), class, direct only
- **Hotel preferences**: category, amenities
- **Trip types**: safari, beach, city, adventure

## Adding New Automations

1. **Create automation file**:
```python
# app/v2/weaver_assistant/automations/my_automation.py
from app.v2.weaver_assistant.automation import BaseAutomation, AutomationResult

class MyAutomation(BaseAutomation):
    async def execute(self, entities, context):
        # Your algorithm here
        return AutomationResult(
            status=AutomationStatus.SUCCESS,
            message="Result message",
            template="my_template",
            data={...},
            actions=[...]
        )
```

2. **Add intent type** to `app/v2/weaver_assistant/intent.py`:
```python
class IntentType(str, Enum):
    MY_INTENT = "my_intent"
```

3. **Add pattern** to `PATTERNS` dict:
```python
IntentType.MY_INTENT: ["keyword1", "keyword2", ...]
```

4. **Register automation** in `service.py`:
```python
from app.v2.weaver_assistant.automations.my_automation import MyAutomation
self.automation_registry.register(IntentType.MY_INTENT, MyAutomation())
```

## Database Collections

### Conversations Collection
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "organization_id": "string",
  "messages": [
    {
      "role": "user|assistant",
      "content": "string",
      "timestamp": "datetime",
      "metadata": {...}
    }
  ],
  "context": {},
  "status": "active|archived",
  "created_at": "datetime",
  "updated_at": "datetime",
  "last_activity": "datetime"
}
```

## Next Steps

To complete the full DMC workflow automation:

1. **Phase 2: CRM & Workflow Engine**
   - Lead tracking automation
   - Follow-up reminders
   - Conversion stage tracking
   - Pipeline visualization

2. **Phase 3: External Integrations**
   - Amadeus API for real flight/hotel data
   - Payment gateway integration
   - Email/SMS notifications
   - Document storage (S3)

3. **Phase 4: Background Jobs**
   - Scheduled reminders
   - Status monitoring
   - Automated reports
   - Data synchronization

4. **Phase 5: Advanced Features**
   - Analytics dashboard
   - Multi-channel support (WhatsApp, Telegram)
   - Advanced NLP for ambiguous queries
   - Machine learning for personalization

## Files Structure

```
app/v2/weaver_assistant/
├── __init__.py
├── intent.py                      # Intent recognition (1% AI)
├── automation.py                  # Base classes
├── service.py                     # Orchestration service
└── automations/
    ├── __init__.py
    ├── greeting.py                # Welcome messages
    ├── flight_search.py           # Flight search algorithm
    ├── hotel_search.py            # Hotel search algorithm
    ├── itinerary_builder.py       # Itinerary templates
    ├── booking_creation.py        # Booking workflow
    ├── view_bookings.py           # Booking queries
    ├── traveler_management.py     # Traveler operations
    └── destination_info.py        # Destination database

app/v2/api/routes/
└── assistant.py                   # API endpoints

app/v2/models/
└── conversation.py                # Data models
```

## Current State

✅ Core automation framework complete
✅ 8 essential automations implemented
✅ Intent recognition working
✅ Frontend connected to V2 API
✅ Conversation management
✅ Template-based responses with actions

The system is ready for testing and can handle the core DMC workflow from inquiry to booking.
