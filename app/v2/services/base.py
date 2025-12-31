"""
Base Service for TravelWeaver V2
Provides common functionality for all business logic services
"""

from abc import ABC
from typing import Any, Dict, List, Optional, TypedDict
from datetime import datetime
import logging


class ServiceResult(TypedDict):
    """Standard service result format"""
    success: bool
    data: Optional[Any]
    error: Optional[str]
    message: Optional[str]
    meta: Optional[Dict[str, Any]]


class ValidationError(Exception):
    """Raised when validation fails"""
    pass


class ServiceError(Exception):
    """Raised when service operation fails"""
    pass


class BaseService(ABC):
    """
    Base class for all services

    Provides:
    - Validation helpers
    - Error handling
    - Result formatting
    - Logging
    """

    def __init__(self):
        """Initialize base service"""
        self.logger = logging.getLogger(self.__class__.__name__)

    def validate_required_fields(
        self,
        data: Dict[str, Any],
        required: List[str]
    ) -> None:
        """
        Validate that all required fields are present

        Args:
            data: Data dictionary to validate
            required: List of required field names

        Raises:
            ValidationError: If any required fields are missing
        """
        missing = [
            field for field in required
            if field not in data or data[field] is None
        ]
        if missing:
            raise ValidationError(
                f"Missing required fields: {', '.join(missing)}"
            )

    def validate_date_range(
        self,
        start_date: str,
        end_date: str
    ) -> None:
        """
        Validate that date range is valid

        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)

        Raises:
            ValidationError: If date range is invalid
        """
        from datetime import datetime

        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        if end <= start:
            raise ValidationError("End date must be after start date")

        if start < datetime.now():
            raise ValidationError("Start date cannot be in the past")

    def success(
        self,
        data: Any = None,
        message: str = None,
        meta: Dict[str, Any] = None
    ) -> ServiceResult:
        """
        Return a success result

        Args:
            data: Result data
            message: Success message
            meta: Additional metadata

        Returns:
            ServiceResult with success=True
        """
        return {
            "success": True,
            "data": data,
            "error": None,
            "message": message,
            "meta": meta or {}
        }

    def error(
        self,
        error: str,
        message: str = None,
        meta: Dict[str, Any] = None
    ) -> ServiceResult:
        """
        Return an error result

        Args:
            error: Error code or description
            message: User-friendly error message
            meta: Additional error metadata

        Returns:
            ServiceResult with success=False
        """
        self.logger.error(f"Service error: {error}")
        return {
            "success": False,
            "data": None,
            "error": error,
            "message": message or error,
            "meta": meta or {}
        }

    def log_operation(
        self,
        operation: str,
        params: Dict[str, Any],
        result: str = "started"
    ) -> None:
        """
        Log service operation

        Args:
            operation: Operation name
            params: Operation parameters
            result: Operation result (started, success, failed)
        """
        self.logger.info(
            f"{operation} {result}",
            extra={"params": params}
        )
