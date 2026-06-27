"""Settings/provider status and API key management endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings as cfg
from app.database.db import get_db
from app.models.schemas import ApiKeyUpdate, ProviderStatus, SettingsResponse
from app.services.keystore import ABUSE, VT, keystore

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _mask_key(key: str) -> str | None:
    if not key or len(key) < 8:
        return None
    return key[:4] + "..." + key[-4:]


def _build_provider_list() -> list[ProviderStatus]:
    return [
        ProviderStatus(
            name="VirusTotal",
            enabled=keystore.is_enabled(VT),
            key_hint=_mask_key(keystore.get(VT)),
        ),
        ProviderStatus(
            name="AbuseIPDB",
            enabled=keystore.is_enabled(ABUSE),
            key_hint=_mask_key(keystore.get(ABUSE)),
        ),
    ]


@router.get("", response_model=SettingsResponse)
async def get_settings():
    """Return provider availability and configuration limits (keys are masked)."""
    return SettingsResponse(
        providers=_build_provider_list(),
        max_upload_mb=cfg.max_upload_mb,
        max_iocs_per_scan=cfg.max_iocs_per_scan,
    )


@router.put("/keys", response_model=SettingsResponse)
async def update_api_keys(
    body: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Save API keys for one or more providers.
    Pass an empty string to clear a key; omit a field to leave it unchanged.
    Keys are persisted in SQLite and take effect immediately (no restart needed).
    """
    if body.virustotal_api_key is not None:
        await keystore.set(db, VT, body.virustotal_api_key)

    if body.abuseipdb_api_key is not None:
        await keystore.set(db, ABUSE, body.abuseipdb_api_key)

    return SettingsResponse(
        providers=_build_provider_list(),
        max_upload_mb=cfg.max_upload_mb,
        max_iocs_per_scan=cfg.max_iocs_per_scan,
    )
