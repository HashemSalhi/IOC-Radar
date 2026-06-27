"""
In-memory key store for API keys.

Priority (highest wins):
  1. Keys saved through the web UI (persisted in SQLite, loaded on startup).
  2. Keys set in backend/.env (read at process start by pydantic-settings).

This lets operators configure keys once via the UI without editing files or
restarting the backend.
"""
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.providers.catalog import PROVIDERS

logger = logging.getLogger(__name__)


class KeyStore:
    def __init__(self):
        self._keys: dict[str, str] = {}
        self._enabled: dict[str, bool] = {}  # toggle; default True when absent
        # Seed from env so the store is usable before DB is loaded
        self._load_from_env()

    def _load_from_env(self) -> None:
        for info in PROVIDERS:
            value = getattr(settings, info.env_attr, "").strip()
            if value:
                self._keys[info.id] = value

    async def load_from_db(self, db: AsyncSession) -> None:
        """Called once during app startup; DB values override env values."""
        from app.database.crud import get_all_provider_state

        state = await get_all_provider_state(db)
        for provider, row in state.items():
            if row["key"].strip():
                self._keys[provider] = row["key"].strip()
            self._enabled[provider] = row["enabled"]
            logger.info(
                "Loaded provider '%s' from database (enabled=%s)", provider, row["enabled"]
            )

    async def set(self, db: AsyncSession, provider: str, key: str) -> None:
        """Update a key in memory and persist it to the database."""
        from app.database.crud import upsert_api_key

        key = key.strip()
        if key:
            self._keys[provider] = key
        else:
            self._keys.pop(provider, None)

        await upsert_api_key(db, provider, key)
        logger.info("API key for '%s' updated via web UI", provider)

    async def set_enabled(self, db: AsyncSession, provider: str, enabled: bool) -> None:
        """Persist the on/off toggle for a provider."""
        from app.database.crud import set_provider_enabled

        self._enabled[provider] = enabled
        await set_provider_enabled(db, provider, enabled)
        logger.info("Provider '%s' toggled %s", provider, "ON" if enabled else "OFF")

    def get(self, provider: str) -> str:
        return self._keys.get(provider, "")

    def has_key(self, provider: str) -> bool:
        return bool(self._keys.get(provider, "").strip())

    def is_enabled(self, provider: str) -> bool:
        """User on/off toggle (defaults to True)."""
        return self._enabled.get(provider, True)

    def is_active(self, provider: str) -> bool:
        """A provider runs only if it has a key AND is toggled on."""
        return self.has_key(provider) and self.is_enabled(provider)


keystore = KeyStore()
