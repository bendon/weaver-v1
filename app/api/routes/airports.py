"""
Airports routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel
from app.api.deps import get_amadeus_client
from app.amadeus_client import AmadeusClient
from app.core.database import get_connection

router = APIRouter()


class AirportSearchRequest(BaseModel):
    keyword: str
    sub_type: Optional[str] = "AIRPORT"  # AIRPORT or CITY


def search_airports_local(keyword: str, limit: int = 50) -> List[dict]:
    """
    Search airports from local database
    Searches by IATA code, airport name, city name, or country
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    keyword_lower = keyword.lower()
    keyword_upper = keyword.upper()
    
    # Search by IATA code (exact match), name, city, or country
    cursor.execute("""
        SELECT 
            iata_code,
            name,
            city,
            country
        FROM airports
        WHERE 
            iata_code = ? OR
            iata_code LIKE ? OR
            LOWER(name) LIKE ? OR
            LOWER(city) LIKE ? OR
            LOWER(country) LIKE ?
        ORDER BY 
            CASE WHEN iata_code = ? THEN 1 ELSE 2 END,
            CASE WHEN LOWER(name) LIKE ? THEN 1 ELSE 2 END,
            CASE WHEN LOWER(city) LIKE ? THEN 1 ELSE 2 END
        LIMIT ?
    """, (
        keyword_upper,  # Exact IATA match
        f"{keyword_upper}%",  # IATA starts with
        f"%{keyword_lower}%",  # Name contains
        f"%{keyword_lower}%",  # City contains
        f"%{keyword_lower}%",  # Country contains
        keyword_upper,  # For ordering
        f"{keyword_lower}%",  # For ordering (name starts with)
        f"{keyword_lower}%",  # For ordering (city starts with)
        limit
    ))
    
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for row in rows:
        # Extract country code from country name if possible
        country_code = ""
        country = row["country"] or ""
        # Simple mapping for common countries (can be expanded)
        country_code_map = {
            "United States": "US", "United Kingdom": "GB", "Netherlands": "NL",
            "Kenya": "KE", "France": "FR", "Germany": "DE", "Spain": "ES",
            "Italy": "IT", "Switzerland": "CH", "Austria": "AT", "Denmark": "DK",
            "Sweden": "SE", "Norway": "NO", "Finland": "FI", "Qatar": "QA",
            "United Arab Emirates": "AE", "Egypt": "EG", "South Africa": "ZA",
            "Rwanda": "RW", "Uganda": "UG", "Tanzania": "TZ", "Sudan": "SD",
            "Ethiopia": "ET", "Nigeria": "NG", "Ghana": "GH", "Senegal": "SN",
            "Morocco": "MA", "Tunisia": "TN", "Algeria": "DZ", "Japan": "JP",
            "Malaysia": "MY", "Indonesia": "ID", "Philippines": "PH", "India": "IN",
            "Russia": "RU", "Canada": "CA", "Brazil": "BR", "Argentina": "AR",
            "Chile": "CL", "Peru": "PE", "Colombia": "CO", "Mexico": "MX",
            "China": "CN", "South Korea": "KR", "Hong Kong": "HK", "Thailand": "TH",
            "Australia": "AU", "Singapore": "SG", "Turkey": "TR"
        }
        country_code = country_code_map.get(country, "")
        
        results.append({
            "iataCode": row["iata_code"],
            "name": row["name"],
            "cityName": row["city"] or "",
            "countryCode": country_code
        })
    
    return results


@router.post("/search")
async def search_airports(
    request: AirportSearchRequest,
    client: Optional[AmadeusClient] = Depends(get_amadeus_client)
):
    """
    Search for airports or cities
    First searches local database, then falls back to Amadeus API if needed
    Public endpoint - no authentication required
    """
    keyword = request.keyword.strip()
    
    if len(keyword) < 2:
        return {
            "data": [],
            "meta": {"count": 0}
        }
    
    # First, try local database
    local_results = search_airports_local(keyword)
    
    # If we have good results from local DB, return them
    if len(local_results) >= 5 or (len(local_results) > 0 and keyword.upper() in [r["iataCode"] for r in local_results]):
        return {
            "data": local_results,
            "meta": {"count": len(local_results)}
        }
    
    # If local results are insufficient and Amadeus is available, try Amadeus
    if client and len(local_results) < 5:
        try:
            amadeus_results = client.search_airports(
                keyword=keyword,
                sub_type=request.sub_type or "AIRPORT"
            )
            
            # Transform Amadeus response
            locations = amadeus_results.get("data", [])
            amadeus_transformed = []
            
            for loc in locations:
                amadeus_transformed.append({
                    "iataCode": loc.get("iataCode", ""),
                    "name": loc.get("name", ""),
                    "cityName": loc.get("address", {}).get("cityName", ""),
                    "countryCode": loc.get("address", {}).get("countryCode", "")
                })
            
            # Merge results, avoiding duplicates
            seen_codes = {r["iataCode"] for r in local_results}
            for result in amadeus_transformed:
                if result["iataCode"] not in seen_codes:
                    local_results.append(result)
                    seen_codes.add(result["iataCode"])
            
            return {
                "data": local_results,
                "meta": {"count": len(local_results)}
            }
        except Exception as e:
            print(f"Error searching Amadeus: {e}")
            # Fall through to return local results
    
    # Return local results (even if empty)
    return {
        "data": local_results,
        "meta": {"count": len(local_results)}
    }

