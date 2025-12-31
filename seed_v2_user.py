#!/usr/bin/env python3
"""
Seed a test user for TravelWeaver V2
Creates a test user in MongoDB for V2 authentication
"""

import sys
from pathlib import Path
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from app.v2.core.database import init_databases, get_mongo_db
from app.v2.core.security import hash_password


def seed_v2_user():
    """Create a test user for V2"""
    
    print("=" * 60)
    print("  Seeding TravelWeaver V2 Test User")
    print("=" * 60)
    print()
    
    # Initialize databases
    try:
        init_databases()
    except Exception as e:
        print(f"[WARNING] Database initialization issue: {e}")
        print("   Continuing anyway...")
    
    # Get MongoDB connection
    db = get_mongo_db()
    if db is None:
        print("[ERROR] Could not connect to MongoDB")
        print("   Please ensure MongoDB is running and MONGODB_URL is set correctly")
        return
    
    # Test user details
    user_email = "admin@travelweaver.com"
    user_password = "Admin123!"  # Meets password requirements: uppercase, lowercase, digit, special char
    user_name = "Test Admin"
    user_role = "dmc_admin"
    
    # Check if user already exists
    existing_user = db.users.find_one({"email": user_email.lower()})
    
    if existing_user:
        print(f"[OK] User already exists: {user_email}")
        print(f"   Name: {existing_user.get('full_name', 'N/A')}")
        print(f"   Role: {existing_user.get('role', 'N/A')}")
        print(f"   Status: {existing_user.get('status', 'N/A')}")
        print()
        print("You can login with:")
        print(f"   Email: {user_email}")
        print(f"   Password: {user_password}")
        return
    
    # Hash password
    password_hash = hash_password(user_password)
    
    # Get permissions for role
    from app.v2.api.routes.auth import ROLE_PERMISSIONS
    permissions = ROLE_PERMISSIONS.get(user_role, [])
    
    # Create user document
    user_doc = {
        "email": user_email.lower(),
        "password_hash": password_hash,
        "full_name": user_name,
        "role": user_role,
        "status": "active",
        "organization_id": None,  # Can be set later
        "permissions": permissions,
        "preferences": {},
        "last_login": None,
        "email_verified": True,  # Set to True for test user
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert user
    try:
        result = db.users.insert_one(user_doc)
        print(f"[OK] Created test user successfully!")
        print()
        print("Login credentials:")
        print(f"   Email: {user_email}")
        print(f"   Password: {user_password}")
        print(f"   Role: {user_role}")
        print()
        print(f"User ID: {result.inserted_id}")
    except Exception as e:
        print(f"[ERROR] Error creating user: {e}")
        return


if __name__ == "__main__":
    seed_v2_user()

