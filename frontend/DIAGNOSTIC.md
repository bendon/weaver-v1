# Frontend API Diagnostic

## Issue: Wrong API endpoint being called

You mentioned the chat is calling: `http://localhost:3000/api/chat/hybrid/message`

This is the **OLD V1 API**, not the new V2 WeaverAssistant API.

## Step 1: Verify Which Page You're On

### Check the URL in your browser:

**Correct (V2):**
```
http://localhost:3000/v2/dmc/ai-assistant
```

**Wrong (V1):**
```
http://localhost:3000/ai-assistant
http://localhost:3000/chat
```

### Check the page title:
- V2 page shows: "WeaverAssistant" as the main heading
- V1 page shows: "AI Booking Assistant" as the title

## Step 2: Fix Environment Variable

The `.env.local` file is currently:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

It should be:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2
```

**Fix it:**
```bash
cd /home/user/weaver-v1/frontend

# Update .env.local
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2

# App Configuration
NEXT_PUBLIC_APP_NAME=TravelWeaver V2
NEXT_PUBLIC_APP_DESCRIPTION=AI-Powered DMC Platform
EOF

# Clear Next.js cache
rm -rf .next

# Restart frontend
npm run dev
```

## Step 3: Verify Network Request in Browser

1. Open DevTools (F12)
2. Go to **Network** tab
3. Clear network log (trash icon)
4. Send a message in the chat
5. Look for the POST request

### What you should see (V2 - Correct):

**Request URL:**
```
http://localhost:8000/api/v2/assistant/chat
```

**Request Payload:**
```json
{
  "message": "your message",
  "conversation_id": null
}
```

**Response:**
```json
{
  "success": true,
  "conversation_id": "...",
  "intent": {
    "type": "search_flight",
    "confidence": 0.7,
    "entities": {...}
  },
  "response": {
    "message": "Found 5 flights...",
    "template": "flight_results",
    "actions": [...]
  }
}
```

### What you might be seeing (V1 - Wrong):

**Request URL:**
```
http://localhost:3000/api/chat/hybrid/message
```

**Response:**
```json
{
  "conversation_id": "...",
  "message_id": "...",
  "response": "I encountered an issue: Could not understand...",
  "intent": "unclear",
  "success": false
}
```

## Step 4: Clear Browser Cache

If you've fixed the environment variable but still seeing the old API calls:

1. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely
3. Or open an incognito/private window

## Step 5: Verify Backend Routes are Loaded

Check backend startup logs for:
```
✅ TravelWeaver V2 routes loaded (auth, travelers, bookings, assistant)
```

If you don't see this, restart the backend:
```bash
cd /home/user/weaver-v1
uvicorn app.api.main:app --reload --port 8000
```

## Common Scenarios

### Scenario A: Multiple Browser Tabs
- You might have both the old `/ai-assistant` and new `/v2/dmc/ai-assistant` pages open
- Close all tabs and open only: `http://localhost:3000/v2/dmc/ai-assistant`

### Scenario B: Cached JavaScript
- The browser cached the old API client code
- Solution: Hard refresh or clear cache

### Scenario C: Wrong Environment Variable
- `NEXT_PUBLIC_API_URL` is set incorrectly or missing `/api/v2`
- Solution: Update `.env.local` as shown above and restart frontend

### Scenario D: Frontend Not Restarted
- Changed `.env.local` but didn't restart the dev server
- Solution: Stop (`Ctrl+C`) and restart (`npm run dev`)

## Quick Test Script

Save this to a file and run in the browser console on the V2 page:

```javascript
// Run this in browser console on /v2/dmc/ai-assistant page
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Expected calls to:', process.env.NEXT_PUBLIC_API_URL + '/assistant/chat');

// Test the API client
import('/src/v2/lib/api').then(module => {
  console.log('V2 API Client loaded');
  // Try to see what URL it would construct
});
```

## Still Not Working?

If after all these steps you're still seeing calls to `/api/chat/hybrid/message`:

1. **Screenshot the Network tab** showing the request URL, headers, and payload
2. **Screenshot the browser URL bar** showing which page you're on
3. **Share the console logs** from both browser console and backend logs
4. **Verify** you're not using the Sidebar "AI Assistant" link incorrectly

The V2 WeaverAssistant automation framework is working perfectly (we tested it). The issue is definitely that the frontend is calling the wrong API endpoint, which is a configuration or routing issue, not a problem with the automation system itself.
