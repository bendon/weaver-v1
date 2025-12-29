#!/usr/bin/env python3
"""
Flight Monitor Service Runner
Run this script to start the background flight monitoring service
"""

import os
from dotenv import load_dotenv
from app.amadeus_client import AmadeusClient
from app.flight_monitor import start_flight_monitor

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get Amadeus credentials
    api_key = os.getenv("AMADEUS_API_KEY")
    api_secret = os.getenv("AMADEUS_API_SECRET")
    environment = os.getenv("AMADEUS_ENVIRONMENT", "test")
    
    if not api_key or not api_secret:
        print("Error: AMADEUS_API_KEY and AMADEUS_API_SECRET must be set")
        exit(1)
    
    # Initialize Amadeus client
    amadeus_client = AmadeusClient(
        api_key=api_key,
        api_secret=api_secret,
        environment=environment
    )
    
    print("Starting Flight Monitor Service...")
    print("Monitoring flights every 15 minutes")
    print("Press Ctrl+C to stop")
    
    # Start monitoring (runs indefinitely)
    try:
        start_flight_monitor(amadeus_client, interval_minutes=15)
    except KeyboardInterrupt:
        print("\nFlight Monitor Service stopped")

