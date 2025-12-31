"""
Base Models for TravelWeaver V2
Common Pydantic models used across the application
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, Dict
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class MongoBaseModel(BaseModel):
    """
    Base model for MongoDB documents

    Provides:
    - ObjectId support
    - Timestamp fields
    - JSON serialization
    """

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class APIBaseModel(BaseModel):
    """
    Base model for API requests/responses

    Provides:
    - Consistent validation
    - Serialization config
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True
    )


class PaginationParams(BaseModel):
    """Pagination query parameters"""

    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Items per page"
    )


class PaginationResponse(BaseModel):
    """Pagination response metadata"""

    current_page: int
    per_page: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool
    next_page: Optional[int] = None
    prev_page: Optional[int] = None


class APIResponse(BaseModel):
    """Standard API response wrapper"""

    success: bool
    data: Optional[Any] = None
    message: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    pagination: Optional[PaginationResponse] = None


class Location(BaseModel):
    """Geographic location"""

    country: str = Field(..., min_length=2, max_length=2, description="ISO country code")
    country_name: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = Field(
        default=None,
        description="Lat/lng coordinates"
    )


class ContactInfo(BaseModel):
    """Contact information"""

    email: Optional[str] = Field(None, pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    website: Optional[str] = None


class Price(BaseModel):
    """Price information"""

    amount: float = Field(..., ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    @property
    def formatted(self) -> str:
        """Format price as string"""
        return f"{self.currency} {self.amount:.2f}"
