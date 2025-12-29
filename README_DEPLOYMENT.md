# TravelWeaver Platform - Quick Start

## 🚀 Quick Start

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment (copy .env.example to .env and fill in values)
cp .env.example .env

# Run server
python main.py
```

Backend runs on http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

## 📋 Current Status

✅ **Completed:**
- Project structure refactored
- Database schema implemented (SQLite)
- Core configuration and security
- Basic API routes (auth, bookings, travelers, flights)
- Database initialization

⏳ **In Progress:**
- Service layer implementation
- AI Booking Assistant
- WhatsApp integration
- Automation engine

## 🔧 Environment Variables

See `DEPLOYMENT.md` for complete environment variable list.

Minimum required:
- `SECRET_KEY` - App secret key
- `AMADEUS_CLIENT_ID` / `AMADEUS_API_KEY` - Amadeus credentials
- `AMADEUS_CLIENT_SECRET` / `AMADEUS_API_SECRET` - Amadeus secret

## 📚 Documentation

- API Docs: http://localhost:8000/api/docs
- Deployment Guide: `DEPLOYMENT.md`
- Progress: `REFACTORING_PROGRESS.md`

## 🐛 Troubleshooting

**Import errors?**
```bash
pip install -r requirements.txt
```

**Database errors?**
```bash
python -c "from app.core.database import init_database; init_database()"
```

**App won't start?**
- Check `.env` file exists
- Verify all dependencies installed
- Check Python version (3.11+)

