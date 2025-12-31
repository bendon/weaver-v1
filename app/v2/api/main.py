"""
TravelWeaver 2.0 - Main FastAPI Application
Service-oriented travel booking platform with AI-powered assistance
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.v2.core.config import settings
from app.v2.core.database import init_databases, close_databases
from app.v2.api.routes import auth


# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager
    Handles startup and shutdown events
    """
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_databases()
    yield
    # Shutdown
    print("Shutting down...")
    close_databases()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="TravelWeaver 2.0 API - Service-oriented travel booking platform",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600
)

# Include routers
from app.v2.api.routes import travelers, bookings

app.include_router(auth.router, prefix="/api/v2/auth", tags=["V2 - Authentication"])
app.include_router(travelers.router, prefix="/api/v2/travelers", tags=["V2 - Travelers"])
app.include_router(bookings.router, prefix="/api/v2/bookings", tags=["V2 - Bookings"])


# Health check
@app.get("/api/v2/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/api/v2")
async def root():
    """API root"""
    return {
        "message": "TravelWeaver 2.0 API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "description": "Service-oriented travel booking platform with AI-powered assistance"
    }
