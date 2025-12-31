"""
Automation Base Classes and Registry
Your algorithms (99%) live here
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class AutomationStatus(str, Enum):
    """Status of automation execution"""
    SUCCESS = "success"
    FAILED = "failed"
    PARTIAL = "partial"
    REQUIRES_INPUT = "requires_input"


class AutomationResult(BaseModel):
    """Result from automation execution"""
    status: AutomationStatus
    data: Optional[Any] = None
    message: Optional[str] = None
    template: Optional[str] = None  # Template to use for rendering
    actions: List[Dict[str, Any]] = Field(default_factory=list)  # Available actions
    requires_confirmation: bool = False
    next_step: Optional[str] = None


class BaseAutomation(ABC):
    """
    Base class for all automations
    This is where your 99% algorithms live
    """

    def __init__(self):
        self.name = self.__class__.__name__
        self.description = self.__doc__ or "No description"

    @abstractmethod
    async def execute(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> AutomationResult:
        """
        Execute the automation logic

        Args:
            entities: Extracted entities from user query
            context: Conversation context (user, organization, history)

        Returns:
            AutomationResult with data and template
        """
        pass

    def validate_entities(
        self,
        entities: Dict[str, Any],
        required: List[str]
    ) -> Optional[str]:
        """
        Validate that required entities are present
        Returns error message if validation fails
        """
        missing = [field for field in required if field not in entities]
        if missing:
            return f"I need more information: {', '.join(missing)}"
        return None


class AutomationRegistry:
    """
    Registry of all available automations
    Maps intent types to automation handlers
    """

    def __init__(self):
        self._automations: Dict[str, BaseAutomation] = {}

    def register(self, intent_type: str, automation: BaseAutomation):
        """Register an automation for an intent type"""
        self._automations[intent_type] = automation

    def get(self, intent_type: str) -> Optional[BaseAutomation]:
        """Get automation handler for intent type"""
        return self._automations.get(intent_type)

    def list_all(self) -> List[str]:
        """List all registered intent types"""
        return list(self._automations.keys())


# Global automation registry
automation_registry = AutomationRegistry()
