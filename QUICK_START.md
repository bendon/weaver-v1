# TravelWeaver - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env` file in project root:

```bash
# Minimum required
SECRET_KEY=your-secret-key-here
AMADEUS_CLIENT_ID=your-amadeus-id
AMADEUS_CLIENT_SECRET=your-amadeus-secret

# Optional but recommended
DATABASE_URL=sqlite:///./data/travelweaver.db
FRONTEND_URL=http://localhost:3000
PUBLIC_URL=http://localhost:3000
```

### 3. Run the Application

**Backend (Terminal 1):**
```bash
python main.py
```
✅ Backend runs on http://localhost:8000

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on http://localhost:3000

## ✅ Verify Installation

1. **Check Backend Health:**
   - Open http://localhost:8000/health
   - Should return: `{"status": "healthy", "version": "2.0.0"}`

2. **View API Documentation:**
   - Open http://localhost:8000/api/docs
   - Interactive API documentation

3. **Test Registration:**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "password123",
       "name": "Admin User",
       "organization_name": "My Travel Company"
     }'
   ```

## 📋 What's Working

✅ **Backend API**
- Authentication (login/register)
- Bookings management
- Travelers management
- Flight search (Amadeus)
- Public itinerary access

✅ **Database**
- SQLite database
- Complete schema
- Auto-initialization

✅ **API Documentation**
- Swagger UI at `/api/docs`
- ReDoc at `/api/redoc`

## 🔧 Troubleshooting

**Import errors?**
```bash
pip install -r requirements.txt
```

**Database errors?**
```bash
python -c "from app.core.database import init_database; init_database()"
```

**Port already in use?**
- Change port in `main.py` or use environment variable

**CORS errors?**
- Check `FRONTEND_URL` in `.env` matches your frontend URL

## 📚 Next Steps

1. Read `DEPLOYMENT.md` for production deployment
2. Check `PROJECT_STATUS.md` for current features
3. Review `REFACTORING_PROGRESS.md` for implementation status

## 🎯 Key Endpoints

- **Health**: `GET /health`
- **API Docs**: `GET /api/docs`
- **Register**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Create Booking**: `POST /api/bookings`
- **Search Flights**: `POST /api/flights/search`

## 💡 Tips

- Use the API docs at `/api/docs` to explore all endpoints
- Database is automatically created on first run
- All routes are protected except `/api/public/*` and `/api/auth/register`
- JWT tokens are required for authenticated endpoints

