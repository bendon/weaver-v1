"""
Database connections for TravelWeaver V2
Handles MongoDB and SQLite connections
"""

import sqlite3
from pymongo import MongoClient
from typing import Optional
from pathlib import Path
from app.v2.core.config import settings


# MongoDB Connection
class MongoDB:
    """MongoDB connection manager"""

    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None

    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
            self.db = self.client[settings.MONGODB_DATABASE]

            # Test connection
            self.client.server_info()
            print(f"[OK] Connected to MongoDB: {settings.MONGODB_DATABASE}")

            # Create indexes
            self._create_indexes()

        except Exception as e:
            print(f"[WARNING] MongoDB not available - V2 features will be limited")
            print(f"   Error: {e}")
            self.client = None
            self.db = None

    def _create_indexes(self):
        """Create database indexes"""
        if self.db is None:
            return
        try:
            # Users collection
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("organization_id")

            # Organizations collection
            self.db.organizations.create_index("slug", unique=True)

            # Bookings collection
            self.db.bookings.create_index("booking_code", unique=True)
            self.db.bookings.create_index("organization_id")
            self.db.bookings.create_index("traveler_id")
            self.db.bookings.create_index("status")

            # Conversations collection
            self.db.conversations.create_index("organization_id")
            self.db.conversations.create_index("user_id")

            # Travelers collection
            self.db.travelers.create_index([("organization_id", 1), ("email", 1)], unique=True)

            # Payments collection
            self.db.payments.create_index("booking_id")

            print("[OK] MongoDB indexes created")

        except Exception as e:
            print(f"Warning: Error creating indexes: {e}")

    def close(self):
        """Close MongoDB connection"""
        if self.client is not None:
            self.client.close()
            print("[OK] MongoDB connection closed")

    def get_database(self):
        """Get database instance"""
        if self.db is None:
            self.connect()
        return self.db


# SQLite Connection
class SQLiteDB:
    """SQLite connection manager for reference data"""

    def __init__(self):
        self.conn: Optional[sqlite3.Connection] = None
        self.db_path = settings.SQLITE_PATH

    def connect(self):
        """Connect to SQLite database"""
        try:
            # Create directory if it doesn't exist
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)

            # Connect to database
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries

            print(f"[OK] Connected to SQLite: {self.db_path}")

            # Create tables
            self._create_tables()

        except Exception as e:
            print(f"✗ Failed to connect to SQLite: {e}")
            raise

    def _create_tables(self):
        """Create database tables"""
        try:
            cursor = self.conn.cursor()

            # Airports table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS airports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    iata_code TEXT UNIQUE NOT NULL,
                    icao_code TEXT,
                    name TEXT NOT NULL,
                    city TEXT NOT NULL,
                    country TEXT NOT NULL,
                    latitude REAL,
                    longitude REAL,
                    timezone TEXT
                )
            """)

            # Airlines table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS airlines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    iata_code TEXT UNIQUE NOT NULL,
                    icao_code TEXT,
                    name TEXT NOT NULL,
                    country TEXT,
                    alliance TEXT,
                    logo_url TEXT
                )
            """)

            # Countries table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS countries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    currency TEXT,
                    phone_code TEXT,
                    region TEXT
                )
            """)

            # Currencies table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS currencies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    symbol TEXT,
                    exchange_rate REAL DEFAULT 1.0,
                    updated_at TEXT
                )
            """)

            # Email templates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_templates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    subject TEXT NOT NULL,
                    html_content TEXT NOT NULL,
                    text_content TEXT,
                    variables TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)

            # Content table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS content (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    author TEXT,
                    status TEXT DEFAULT 'published',
                    created_at TEXT,
                    updated_at TEXT
                )
            """)

            self.conn.commit()
            print("[OK] SQLite tables created")

        except Exception as e:
            print(f"Warning: Error creating tables: {e}")

    def close(self):
        """Close SQLite connection"""
        if self.conn:
            self.conn.close()
            print("[OK] SQLite connection closed")

    def get_connection(self):
        """Get database connection"""
        if not self.conn:
            self.connect()
        return self.conn

    def execute(self, query: str, params: tuple = ()):
        """Execute a query"""
        if not self.conn:
            self.connect()
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor


# Global database instances
mongodb = MongoDB()
sqlite_db = SQLiteDB()


# Helper functions
def get_mongo_db():
    """Get MongoDB database instance"""
    return mongodb.get_database()


def get_sqlite_conn():
    """Get SQLite connection"""
    return sqlite_db.get_connection()


def init_databases():
    """Initialize all databases"""
    print("Initializing databases...")
    mongodb.connect()
    sqlite_db.connect()
    print("[OK] All databases initialized")


def close_databases():
    """Close all database connections"""
    print("Closing databases...")
    mongodb.close()
    sqlite_db.close()
    print("[OK] All databases closed")
