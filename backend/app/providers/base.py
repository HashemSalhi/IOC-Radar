"""Abstract base class for threat intelligence providers."""
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import httpx

from app.models.schemas import ProviderResult

# All IOC types understood by the system
IOC_TYPES = {"md5", "sha1", "sha256", "ip", "domain", "url"}

# Hash types are unified into a "hash" capability bucket
HASH_TYPES = {"md5", "sha1", "sha256"}


class Provider(ABC):
    name: str  # unique provider identifier, e.g. "virustotal"

    @abstractmethod
    def supports(self, ioc_type: str) -> bool:
        """Return True if this provider can handle the given IOC type."""

    @abstractmethod
    async def lookup(
        self,
        client: "httpx.AsyncClient",
        ioc: str,
        ioc_type: str,
    ) -> ProviderResult:
        """Perform the lookup and return a normalised ProviderResult."""
