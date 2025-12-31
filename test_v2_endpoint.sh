#!/bin/bash
# Test script for V2 Assistant API

echo "==================================================================="
echo "Testing WeaverAssistant V2 API Endpoint"
echo "==================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running. Please start it with: uvicorn app.api.main:app --reload --port 8000${NC}"
    exit 1
fi
echo ""

# Step 2: Login to get token (you'll need to update with real credentials)
echo "2. Login to get auth token..."
echo "   (You'll need to run this manually with your credentials)"
echo ""
echo "   curl -X POST 'http://localhost:8000/api/v2/auth/login' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\": \"your_email@example.com\", \"password\": \"your_password\"}'"
echo ""
echo "   Copy the access_token from the response and set it as TOKEN variable:"
echo "   export TOKEN='your_access_token_here'"
echo ""

# Check if TOKEN is set
if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ TOKEN not set. Please login and set TOKEN environment variable.${NC}"
    echo ""
    echo "Quick test without auth (will fail with 401 but shows endpoint is registered):"
    echo ""

    # Test endpoint exists (will get 401 but that's ok)
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST 'http://localhost:8000/api/v2/assistant/chat' \
      -H 'Content-Type: application/json' \
      -d '{"message": "Hello"}' 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

    if [ "$HTTP_CODE" = "401" ]; then
        echo -e "${GREEN}✓ Endpoint is registered (got expected 401 Unauthorized)${NC}"
        echo "   Response: $BODY"
    elif [ "$HTTP_CODE" = "404" ]; then
        echo -e "${RED}✗ Endpoint not found (404) - route may not be registered${NC}"
        echo "   Response: $BODY"
    else
        echo "   HTTP Code: $HTTP_CODE"
        echo "   Response: $BODY"
    fi

    exit 0
fi

# Step 3: Test the endpoint
echo "3. Testing /api/v2/assistant/chat endpoint..."
echo ""
echo "Sending message: 'Check for available flights for me for tomorrow from Kampala to Nairobi'"
echo ""

RESPONSE=$(curl -s -X POST 'http://localhost:8000/api/v2/assistant/chat' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Check for available flights for me for tomorrow from Kampala to Nairobi"
  }')

echo "Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if response is successful
if echo "$RESPONSE" | grep -q '"success": true'; then
    echo -e "${GREEN}✓ Test successful!${NC}"
else
    echo -e "${RED}✗ Test failed or returned success: false${NC}"
fi

echo ""
echo "==================================================================="
