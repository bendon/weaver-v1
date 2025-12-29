# TravelWeaver Platform - Deployment Guide

## Overview

TravelWeaver is a B2B SaaS platform for DMCs (Destination Management Companies) with both backend (FastAPI) and frontend (React/Next.js) components.

## Project Structure

```
BUMBA/
├── app/                    # Backend (FastAPI)
│   ├── core/              # Core modules (config, security, database)
│   ├── api/               # API routes
│   │   └── routes/        # Route modules
│   ├── services/          # Service layer (to be implemented)
│   ├── models/            # Data models
│   └── schemas/           # Pydantic schemas
├── frontend/              # Frontend (React/Vite)
└── data/                  # Database files
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- SQLite (included with Python)

## Backend Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=sqlite:///./data/travelweaver.db

# App
SECRET_KEY=your-secret-key-here
DEBUG=False
FRONTEND_URL=http://localhost:3000
PUBLIC_URL=http://localhost:3000

# Amadeus (use either set of variable names)
AMADEUS_CLIENT_ID=your-client-id
AMADEUS_CLIENT_SECRET=your-client-secret
# OR
AMADEUS_API_KEY=your-api-key
AMADEUS_API_SECRET=your-api-secret

AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_ENVIRONMENT=test

# WhatsApp (360dialog) - Optional
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret

# LLM (Claude/Anthropic) - Optional
ANTHROPIC_API_KEY=your-anthropic-key

# SMS (Africa's Talking) - Optional
AT_USERNAME=your-username
AT_API_KEY=your-api-key

# Weather - Optional
OPENWEATHER_API_KEY=your-weather-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRY_HOURS=24
```

### 3. Initialize Database

The database will be automatically initialized on first startup. Or manually:

```bash
python -c "from app.core.database import init_database; init_database()"
```

### 4. Run Backend

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000
```

### 3. Run Frontend

```bash
npm run dev
```

Frontend will be available at http://localhost:3000

## Production Deployment

### Backend (FastAPI)

#### Option 1: Using Uvicorn

```bash
uvicorn app.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Option 2: Using Gunicorn + Uvicorn

```bash
pip install gunicorn
gunicorn app.api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t travelweaver-backend .
docker run -p 8000:8000 --env-file .env travelweaver-backend
```

### Frontend (React/Vite)

#### Build

```bash
cd frontend
npm run build
```

#### Serve with Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Database Migration

If migrating from the old database:

1. The new database uses `data/travelweaver.db` (old was `data/itineraries.db`)
2. Schema is completely new - manual migration may be needed
3. Old data can be exported and imported if needed

## Environment-Specific Configurations

### Development

- `DEBUG=True`
- Use SQLite
- CORS allows all origins

### Production

- `DEBUG=False`
- Use PostgreSQL (recommended) or keep SQLite
- Set specific CORS origins
- Use environment variables for secrets
- Enable HTTPS
- Set up proper logging

## Health Checks

- Backend: `GET http://localhost:8000/health`
- Frontend: Check if it loads

## Troubleshooting

### Import Errors

If you see import errors, ensure:
- All dependencies are installed: `pip install -r requirements.txt`
- Python path includes project root
- Virtual environment is activated

### Database Errors

- Check database file permissions
- Ensure `data/` directory exists
- Run `init_database()` manually if needed

### CORS Errors

- Update `FRONTEND_URL` in `.env`
- Check CORS middleware configuration in `app/api/main.py`

## Next Steps

1. ✅ Backend structure created
2. ✅ Database schema implemented
3. ✅ Basic API routes working
4. ⏳ Implement service layer (Amadeus, WhatsApp, LLM, etc.)
5. ⏳ Add AI Booking Assistant
6. ⏳ Add WhatsApp integration
7. ⏳ Add automation engine
8. ⏳ Add flight monitoring
9. ⏳ Frontend integration

## Support

For issues or questions, refer to:
- `REFACTORING_PROGRESS.md` - Current progress
- API documentation at `/api/docs`
- Specification document

