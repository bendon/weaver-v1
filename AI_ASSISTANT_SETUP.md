# AI Booking Assistant - Setup Guide

## Overview

The AI Booking Assistant is now fully implemented using Anthropic's Claude 3.5 Sonnet model. It enables conversational booking creation through natural language with automatic tool calling.

## Features

✅ **Conversational Booking Creation** - Create bookings through natural conversation
✅ **Flight Search Integration** - Real-time Amadeus flight search
✅ **Automatic Tool Calling** - Claude autonomously calls booking functions
✅ **Traveler Management** - Add and link travelers to bookings
✅ **Conversation Persistence** - All chats saved to database
✅ **Multi-turn Conversations** - Full conversation history maintained

## Available Tools

The AI assistant has access to these tools:

1. **search_flights** - Search Amadeus for real flight options
2. **create_booking** - Create a new booking/itinerary
3. **add_traveler** - Add travelers and link to bookings
4. **add_flight_to_booking** - Add selected flights to bookings
5. **get_booking_details** - Retrieve booking information
6. **list_travelers** - List all travelers in organization

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `anthropic==0.18.1` - Anthropic Python SDK
- All other required dependencies

### 2. Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env

# Edit .env and add your keys
nano .env
```

Add your Anthropic API key:

```env
# Anthropic AI (Required for Booking Assistant)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx...

# Amadeus API (Required for flight search)
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
AMADEUS_ENVIRONMENT=test
```

### 4. Initialize Database

The conversation tables are already in the schema. Just initialize:

```bash
python -c "from app.core.database import init_database; init_database()"
```

### 5. Start the Backend

```bash
# From project root
uvicorn main:app --reload --port 8000
```

The AI assistant will automatically initialize if the API key is set.

### 6. Test the AI Assistant

The frontend AI Assistant page is already fully built at `/ai-assistant`.

**API Endpoint:**
```bash
POST http://localhost:8000/api/chat/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "I want to book a trip to Kenya from New York for 2 people from March 15-25, 2025",
  "conversation_id": null  // or existing conversation ID
}
```

**Response:**
```json
{
  "conversation_id": "abc123...",
  "message_id": "msg_456...",
  "response": "I'd be happy to help you plan your Kenya trip! Let me search for flights...",
  "tool_calls": [
    {
      "name": "search_flights",
      "input": {...},
      "result": {...}
    }
  ]
}
```

## Example Conversations

### Example 1: Simple Booking

**User:** "I need to book a safari to Kenya for 2 people"

**Assistant:** "I'd love to help with your Kenya safari! Could you provide:
- Departure city
- Travel dates
- Traveler names and contact info"

**User:** "From NYC, March 15-25, travelers are John Smith john@email.com and Jane Doe jane@email.com"

**Assistant calls tools:**
1. `create_booking` - Creates "Kenya Safari" booking
2. `add_traveler` - Adds John Smith
3. `add_traveler` - Adds Jane Doe
4. `search_flights` - Searches NYC to NBO flights

**Assistant:** "Perfect! I've created your booking and found 5 flight options. The best option is..."

### Example 2: Flight Booking

**User:** "Search flights from London to Nairobi on May 1st"

**Assistant calls:** `search_flights`

**Assistant:** "I found 5 flight options:

1. British Airways BA065 - £850 (nonstop, 8h 45m)
2. Kenya Airways KQ100 - £780 (nonstop, 8h 30m)
..."

**User:** "Book option 2 for me"

**Assistant calls:**
1. `create_booking` - Creates booking for May 1-15
2. `add_flight_to_booking` - Adds KQ100

**Assistant:** "Great choice! I've booked Kenya Airways KQ100 for you..."

## Architecture

### Backend Components

**`app/ai_assistant.py`** - Main AI assistant module
- `BookingAssistant` class
- Tool definitions and execution
- Claude API integration
- Conversation management

**`app/api/routes/chat.py`** - API endpoints
- `POST /api/chat/message` - Send message
- `GET /api/chat/conversations` - List conversations
- `GET /api/chat/conversations/{id}` - Get conversation
- `POST /api/chat/conversations` - Create conversation

**`app/core/database.py`** - Database functions
- `create_conversation()` - Create new conversation
- `add_conversation_message()` - Save message
- `get_conversation_messages()` - Retrieve history
- `update_conversation()` - Update metadata

### Database Schema

**conversations table:**
```sql
- id (TEXT PRIMARY KEY)
- organization_id (TEXT)
- user_id (TEXT)
- booking_id (TEXT) - Linked when booking created
- conversation_type (TEXT)
- status (TEXT)
- created_at, updated_at (TEXT)
```

**conversation_messages table:**
```sql
- id (TEXT PRIMARY KEY)
- conversation_id (TEXT FOREIGN KEY)
- role (TEXT) - 'user' | 'assistant' | 'system' | 'tool'
- content (TEXT)
- tool_calls (JSON) - Tool calls and results
- tool_call_id (TEXT)
- created_at (TEXT)
```

### Tool Execution Flow

1. User sends message
2. API loads conversation history from database
3. History sent to Claude with tools
4. Claude decides which tools to call
5. Backend executes each tool (search flights, create booking, etc.)
6. Tool results sent back to Claude
7. Claude generates natural language response
8. Message and response saved to database
9. Response returned to frontend

## Frontend Integration

The frontend is already fully built:

**Location:** `frontend/app/ai-assistant/page.tsx`

**Components:**
- `AIBookingAssistantView` - Main view with sidebar
- `AIChatInterface` - Chat interface component
- Conversation list
- Tool call visualization
- Message history

**API Integration:**
- `api.sendChatMessage()` - Send message
- `api.getConversations()` - List conversations
- `api.createConversation()` - New conversation

## Configuration

### Model Settings

Default model: `claude-3-5-sonnet-20241022`

Change in `app/ai_assistant.py`:
```python
self.model = "claude-3-5-sonnet-20241022"  # or "claude-3-opus-20240229"
```

### Max Tokens

Default: 4096 tokens

Change in API call:
```python
await assistant.chat(
    message=message,
    max_tokens=4096  # Adjust as needed
)
```

### System Prompt

Located in `app/ai_assistant.py` in the `chat()` method:
```python
system_prompt = """You are an expert travel booking assistant..."""
```

Customize this to change the assistant's behavior.

## Troubleshooting

### "AI assistant is not configured"

**Cause:** `ANTHROPIC_API_KEY` not set

**Fix:**
```bash
# Check if key is set
echo $ANTHROPIC_API_KEY

# Set in .env file
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Restart server
```

### "Flight search is not configured"

**Cause:** `AMADEUS_API_KEY` or `AMADEUS_API_SECRET` not set

**Fix:** Add Amadeus credentials to `.env`

### Conversations not saving

**Cause:** Database not initialized

**Fix:**
```bash
python -c "from app.core.database import init_database; init_database()"
```

### Tool calls failing

**Cause:** Missing database functions or Amadeus client

**Fix:** Check logs for specific error, ensure all dependencies installed

## Cost Estimation

Anthropic Claude 3.5 Sonnet pricing (as of 2024):
- **Input:** $3 per million tokens
- **Output:** $15 per million tokens

Typical conversation:
- Average: 500 input + 300 output tokens per message
- Cost per message: ~$0.006 (less than 1 cent)
- Cost per 1000 messages: ~$6

For flight searches with tool calls:
- Average: 1500 input + 800 output tokens
- Cost per search: ~$0.017 (under 2 cents)

**Monthly estimates:**
- 1000 conversations/month: ~$6
- 5000 conversations/month: ~$30
- 10000 conversations/month: ~$60

## API Rate Limits

Claude API limits (Tier 1):
- 50 requests per minute
- 40,000 tokens per minute

For higher limits, contact Anthropic for tier upgrade.

## Security Notes

1. **API Key Security**
   - Never commit `.env` to git
   - Use environment variables in production
   - Rotate keys regularly

2. **User Authorization**
   - All endpoints require authentication
   - Organization-level access control
   - Users can only access their own conversations

3. **Data Privacy**
   - Conversations stored in local database
   - Not sent to Anthropic for training
   - Can be deleted by users

## Next Steps

1. ✅ AI assistant fully implemented
2. ⏭️ Add messaging (WhatsApp, SMS, Email)
3. ⏭️ Add hotel search tool
4. ⏭️ Add activity search tool
5. ⏭️ Enhanced itinerary compilation
6. ⏭️ Production deployment

## Support

For issues or questions:
1. Check logs in terminal where server is running
2. Verify all environment variables are set
3. Ensure database is initialized
4. Check Anthropic API status: https://status.anthropic.com/

---

**AI Booking Assistant is now ready to use!** 🎉

Start the server and navigate to `/ai-assistant` to begin creating bookings through conversation.
