"""
Core configuration for TravelWeaver Platform
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "TravelWeaver"
    APP_VERSION: str = "2.0.0"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/travelweaver.db")
    
    # Frontend URLs
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    PUBLIC_URL: str = os.getenv("PUBLIC_URL", "http://localhost:3000")
    
    # Amadeus (support both old and new env var names)
    AMADEUS_CLIENT_ID: Optional[str] = os.getenv("AMADEUS_CLIENT_ID") or os.getenv("AMADEUS_API_KEY")
    AMADEUS_CLIENT_SECRET: Optional[str] = os.getenv("AMADEUS_CLIENT_SECRET") or os.getenv("AMADEUS_API_SECRET")
    AMADEUS_BASE_URL: str = os.getenv("AMADEUS_BASE_URL", "https://test.api.amadeus.com")
    AMADEUS_ENVIRONMENT: str = os.getenv("AMADEUS_ENVIRONMENT", "test")
    
    # WhatsApp (360dialog)
    WHATSAPP_API_KEY: Optional[str] = os.getenv("WHATSAPP_API_KEY")
    WHATSAPP_WEBHOOK_SECRET: Optional[str] = os.getenv("WHATSAPP_WEBHOOK_SECRET")
    WHATSAPP_BASE_URL: str = os.getenv("WHATSAPP_BASE_URL", "https://waba.360dialog.io")
    
    # SMS (Africa's Talking)
    AT_USERNAME: Optional[str] = os.getenv("AT_USERNAME")
    AT_API_KEY: Optional[str] = os.getenv("AT_API_KEY")
    
    # LLM (Claude/Anthropic)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    
    # Weather
    OPENWEATHER_API_KEY: Optional[str] = os.getenv("OPENWEATHER_API_KEY")
    
    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"  # Ignore extra env vars
    }


settings = Settings()

