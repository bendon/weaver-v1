"""
Configuration Management for TravelWeaver V2
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "TravelWeaver"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database - MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017/travelweaver")
    MONGODB_DATABASE: str = "travelweaver"

    # Database - SQLite
    SQLITE_PATH: str = "./data/reference.db"

    # Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production-min-32-chars")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # API Keys
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    AMADEUS_API_KEY: Optional[str] = os.getenv("AMADEUS_API_KEY")
    AMADEUS_API_SECRET: Optional[str] = os.getenv("AMADEUS_API_SECRET")
    AMADEUS_ENVIRONMENT: str = os.getenv("AMADEUS_ENVIRONMENT", "test")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://app.travelweaver.com",
        "https://travelweaver.com"
    ]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/app.log"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


# Create global settings instance
settings = Settings()
