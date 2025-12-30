# TravelWeaver Full Stack Quick Start

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or SQLite for development)

---

## 🚀 Quick Start (2 Terminals)

### Terminal 1: Backend API

```bash
# From project root
cd /home/user/weaver-v1

# Create virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the API server
uvicorn app.api:app --reload --port 8000
```

**Backend will be available at:** http://localhost:8000
**API Docs:** http://localhost:8000/api/docs

---

### Terminal 2: Frontend

```bash
# From project root
cd /home/user/weaver-v1/frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

**Frontend will be available at:** http://localhost:3000

---

## ✅ Verify Everything is Working

1. **Open Frontend:** http://localhost:3000
2. **Look for Green Circle:** Bottom-right corner should show 🟢 API
3. **Click Green Circle:** Should show "Connected" status
4. **If Red Circle 🔴:** Backend is not running
   - Go to Terminal 1
   - Make sure you see: `Uvicorn running on http://127.0.0.1:8000`
   - Check for errors in terminal

---

## 📱 Available Pages

### Public Pages
- http://localhost:3000 - Landing page
- http://localhost:3000/login - Login page

### DMC (Destination Management Company) Pages
Requires authentication:
- http://localhost:3000/dmc - DMC Dashboard
- http://localhost:3000/flights/search - Flight search
- http://localhost:3000/pnr/import - PNR import
- http://localhost:3000/ai-assistant - AI booking assistant

### Traveler Pages
- http://localhost:3000/traveler - Traveler workspace
- http://localhost:3000/traveler/code/[CODE] - Public itinerary (no auth)

---

## 🔐 Default Login Credentials

If the database is seeded with test data:

```
Email: admin@safaridreams.co.ke
Password: admin123
```

Or register a new account at http://localhost:3000/login

---

## 📊 Database Setup

### Option 1: SQLite (Easy, for development)

No setup needed! The app will create `weaver.db` automatically.

### Option 2: PostgreSQL (Recommended for production)

1. Create database:
```bash
psql -U postgres
CREATE DATABASE weaver;
\q
```

2. Update `.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost/weaver
```

3. Run migrations:
```bash
alembic upgrade head
```

---

## 🧪 Testing the API

### Using the API Status Component

The frontend has a built-in API status indicator (bottom-right):
- 🟢 Green = Connected
- 🟡 Yellow = Checking...
- 🔴 Red = Disconnected

Click it to see:
- Connection status
- Backend URL
- Quick troubleshooting tips

### Using curl

```bash
# Health check
curl http://localhost:8000/api/docs

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get bookings (requires auth token)
curl http://localhost:8000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using the Swagger UI

Open http://localhost:8000/api/docs for interactive API testing.

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Frontend Shows "Cannot reach backend API"

**Check:**
1. Backend terminal shows `Uvicorn running on http://127.0.0.1:8000`
2. Frontend `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Visit http://localhost:8000/api/docs directly in browser

**Solution:**
```bash
# Restart backend
cd /home/user/weaver-v1
uvicorn app.api:app --reload --port 8000
```

---

### Frontend Won't Start

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

---

### Authentication Not Working

**Problem:** Login succeeds but immediately logs out

**Solution:**
1. Check browser console for errors
2. Clear localStorage: Open DevTools → Application → Local Storage → Clear
3. Verify backend returns correct token format

---

### Database Errors

**Problem:** `relation "bookings" does not exist`

**Solution:**
```bash
# Run migrations
alembic upgrade head

# Or seed test data
python seed_test_data.py
```

---

## 📂 Project Structure

```
weaver-v1/
├── app/                      # Backend (FastAPI)
│   ├── api.py               # Main API file
│   ├── database.py          # Database models
│   ├── auth.py              # Authentication
│   └── ...
│
├── frontend/                 # Frontend (Next.js)
│   ├── app/                 # Next.js pages
│   ├── src/                 # Components, services, etc.
│   └── package.json
│
├── alembic/                  # Database migrations
├── requirements.txt          # Python dependencies
└── main.py                   # Entry point
```

---

## 🎯 Next Steps

1. ✅ Both servers running
2. ✅ Green API status indicator
3. ⏭️ Try logging in
4. ⏭️ Create a test booking
5. ⏭️ Search for flights
6. ⏭️ Use AI assistant to create bookings

---

## 📖 Additional Documentation

- **Frontend Setup:** `frontend/SETUP.md`
- **Next.js Migration:** `frontend/README_NEXTJS.md`
- **API Documentation:** http://localhost:8000/api/docs (when running)
- **Feature Spec:** See project documentation

---

## 💡 Development Tips

### Hot Reload

- **Backend:** Changes auto-reload (except `.env` changes)
- **Frontend:** Changes hot-reload automatically
- **CSS:** Hot reloads instantly

### Debugging

- **Backend:** Check terminal output for errors
- **Frontend:** Open browser DevTools → Console
- **Network:** DevTools → Network tab to see API calls
- **React Query:** Install React Query DevTools

### Environment Variables

**Backend** (`.env` in project root):
```env
DATABASE_URL=postgresql://user:pass@localhost/weaver
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_secret
CLAUDE_API_KEY=your_api_key
WHATSAPP_360_API_KEY=your_key
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

**Need Help?** Check the individual READMEs in each directory.
