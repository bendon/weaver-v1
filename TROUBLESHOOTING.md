# WeaverAssistant Troubleshooting Guide

## Problem: Getting "intent: unclear" error

If you're getting a response like this:
```json
{
    "conversation_id": "...",
    "message_id": "...",
    "response": "I encountered an issue: Could not understand the request...",
    "intent": "unclear",
    "success": false
}
```

**This means you're hitting the OLD V1 chat API, not the new V2 WeaverAssistant API.**

## Solution: Verify Correct Endpoint

### Check 1: Frontend Environment Variable

1. Check your `.env` or `.env.local` file in the frontend directory:
```bash
cd /home/user/weaver-v1/frontend
cat .env.local
```

2. Make sure `NEXT_PUBLIC_API_URL` is set to:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2
```

3. If it's not set or is pointing to `/api`, create/update `.env.local`:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2" > .env.local
```

4. **Restart the frontend server** after changing environment variables:
```bash
npm run dev
```

### Check 2: Verify API Call in Browser

1. Open browser DevTools (F12)
2. Go to Network tab
3. Send a message in WeaverAssistant
4. Look for the request to `chat`
5. Check the **Request URL** - it should be:
   - ✅ Correct: `http://localhost:8000/api/v2/assistant/chat`
   - ❌ Wrong: `http://localhost:8000/api/chat` (this is V1)

### Check 3: Test V2 API Directly

Test the V2 endpoint with curl to verify it works:

```bash
# 1. Start the backend (if not running)
cd /home/user/weaver-v1
uvicorn app.api.main:app --reload --port 8000

# 2. In another terminal, test without auth (should get 401)
curl -X POST 'http://localhost:8000/api/v2/assistant/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Hello"}'

# Should return 401 error (not 404)

# 3. Login first
curl -X POST 'http://localhost:8000/api/v2/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "your_email@example.com",
    "password": "your_password"
  }'

# 4. Test with auth token
curl -X POST 'http://localhost:8000/api/v2/assistant/chat' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -d '{
    "message": "Find flights to Nairobi tomorrow"
  }'
```

### Expected V2 Response Format

The V2 API should return this structure:
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
    "message": "Found 5 flights to Nairobi...",
    "template": "flight_results",
    "data": {...},
    "actions": [
      {"type": "button", "label": "Book Flight", "action": "book_flight"}
    ],
    "status": "success"
  }
}
```

## Common Issues

### Issue 1: Frontend caching old API_BASE_URL
**Solution**: Clear browser cache and restart frontend
```bash
# Stop frontend (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

### Issue 2: Backend not loading V2 routes
**Check backend logs on startup** for:
```
✅ TravelWeaver V2 routes loaded (auth, travelers, bookings, assistant)
```

If you don't see this, there's an import error. Check:
```bash
cd /home/user/weaver-v1
python -c "from app.v2.api.routes import assistant; print('V2 routes OK')"
```

### Issue 3: Wrong port or host
Make sure:
- Backend runs on: `http://localhost:8000`
- Frontend runs on: `http://localhost:3000`
- CORS is configured in `app/api/main.py` (should allow all origins in dev)

## Quick Diagnostic Script

Run this to check everything:

```bash
cd /home/user/weaver-v1

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo "Start with: uvicorn app.api.main:app --reload --port 8000"
fi

# Check if V2 assistant endpoint exists (will get 401, but that's ok)
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/v2/assistant/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "test"}')

if [ "$RESPONSE" = "401" ]; then
    echo "✅ V2 Assistant endpoint is registered"
elif [ "$RESPONSE" = "404" ]; then
    echo "❌ V2 Assistant endpoint NOT FOUND (404)"
    echo "Check if V2 routes are loaded in backend"
else
    echo "⚠️  Unexpected response code: $RESPONSE"
fi

# Check frontend env
if [ -f "frontend/.env.local" ]; then
    echo "✅ Frontend .env.local exists"
    grep NEXT_PUBLIC_API_URL frontend/.env.local || echo "⚠️  NEXT_PUBLIC_API_URL not set"
else
    echo "⚠️  frontend/.env.local not found"
    echo "Create it with: echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api/v2' > frontend/.env.local"
fi
```

## Still Not Working?

1. **Check backend logs** when you send a message - you should see the request hit `/api/v2/assistant/chat`
2. **Check browser console** for any errors
3. **Verify network request** in DevTools shows the correct URL
4. **Try testing with curl** to isolate frontend vs backend issues

## Contact

If none of this works, share:
1. The **exact URL** from browser DevTools Network tab
2. Backend startup logs
3. Frontend `.env.local` contents
4. Response you're getting
