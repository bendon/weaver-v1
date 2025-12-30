"""
Main FastAPI application for TravelWeaver Platform
"""

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_database

# Create FastAPI app
app = FastAPI(
    title="TravelWeaver API",
    description="AI-Powered Travel Operations Platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    redirect_slashes=False  # Disable automatic trailing slash redirects
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else [settings.FRONTEND_URL, settings.PUBLIC_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        init_database()
        print("✅ Database initialized")
    except Exception as e:
        print(f"⚠️  Database initialization error: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# Import and include routers
from app.api.routes import auth, bookings, travelers, flights, chat, public, webhooks
from app.api.routes import flights_extended, hotels, transfers, activities
from app.api.routes import itineraries, messages, automation, airports

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(travelers.router, prefix="/api/travelers", tags=["Travelers"])
app.include_router(flights.router, prefix="/api/flights", tags=["Flights"])
# Register flights_extended with specific prefix to avoid route conflicts
# Routes: /api/bookings/{id}/flights and /api/flights/{id}
app.include_router(flights_extended.router, prefix="/api", tags=["Flights Extended"])
# Register specific routes after flights_extended to ensure they're matched correctly
app.include_router(itineraries.router, prefix="/api/itineraries", tags=["Itineraries"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(automation.router, prefix="/api/automation", tags=["Automation"])
app.include_router(airports.router, prefix="/api/airports", tags=["Airports"])
app.include_router(hotels.router, prefix="/api/hotels", tags=["Hotels"])
app.include_router(transfers.router, prefix="/api/transfers", tags=["Transfers"])
app.include_router(activities.router, prefix="/api/activities", tags=["Activities"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(public.router, prefix="/api/public", tags=["Public"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

