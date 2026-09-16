from abc import ABC, abstractmethod
from backend.schemas.neutral_config import NormalizedConfig

class BaseConfigParser(ABC):
    """Abstract base class for all deterministic vendor configuration parsers."""

    @abstractmethod
    def parse(self, raw_config: str, filename: str = "config.cfg") -> NormalizedConfig:
        """Parses raw vendor config text into the standardized NormalizedConfig schema."""
        pass

    @property
    @abstractmethod
    def vendor_name(self) -> str:
        """Returns the canonical vendor identifier."""
        pass
