"""Core scanning orchestrator — fans out IOCs to all applicable providers."""
import asyncio
import logging

import httpx

from app.config import settings
from app.models.schemas import ProviderResult, ScanResult
from app.models.tables import _utcnow
from app.providers.registry import get_providers
from app.services.ioc_detect import detect, refang
from app.services.risk import compute_risk

logger = logging.getLogger(__name__)

# Shared httpx client timeout
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


async def scan_ioc(
    client: httpx.AsyncClient,
    providers: list,
    ioc: str,
    ioc_type: str,
    source_filename: str | None = None,
    file_size: int | None = None,
) -> ScanResult:
    """Dispatch a single IOC to all supporting providers concurrently."""
    applicable = [p for p in providers if p.supports(ioc_type)]

    if not applicable:
        pr = ProviderResult(
            provider="system",
            ioc=ioc,
            ioc_type=ioc_type,
            success=False,
            error=f"No configured provider supports type '{ioc_type}'. Add an API key on the Settings page.",
            raw={"error": "No provider available"},
        )
        return ScanResult(
            ioc=ioc,
            ioc_type=ioc_type,
            risk_score=0.0,
            risk_band="Low",
            status="error",
            provider_results=[pr],
            source_filename=source_filename,
            file_size=file_size,
            created_at=_utcnow(),
        )

    tasks = [p.lookup(client, ioc, ioc_type) for p in applicable]
    results: list[ProviderResult] = await asyncio.gather(*tasks, return_exceptions=False)

    # Determine detection_ratio from first successful VT-style result
    detection_ratio = None
    for r in results:
        if r.success and r.detection_ratio:
            detection_ratio = r.detection_ratio
            break

    risk_score, risk_band = compute_risk(results)

    status = "completed" if any(r.success for r in results) else "error"

    return ScanResult(
        ioc=ioc,
        ioc_type=ioc_type,
        risk_score=risk_score,
        risk_band=risk_band,
        detection_ratio=detection_ratio,
        status=status,
        provider_results=results,
        source_filename=source_filename,
        file_size=file_size,
        created_at=_utcnow(),
    )


async def scan_bulk(
    iocs: list[str],
    source_files: dict[str, tuple[str, int]] | None = None,
) -> list[ScanResult]:
    """
    Scan a list of IOC strings. source_files maps ioc -> (filename, filesize)
    for IOCs derived from file uploads.
    """
    providers = get_providers()

    typed_iocs: list[tuple[str, str]] = []
    for ioc in iocs:
        # Refang first so providers receive a valid indicator (e.g. 8[.]8[.]8[.]8 -> 8.8.8.8)
        clean = refang(ioc)
        ioc_type = detect(clean)
        typed_iocs.append((clean, ioc_type))

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        tasks = []
        for ioc, ioc_type in typed_iocs:
            fname, fsize = (source_files or {}).get(ioc, (None, None))
            tasks.append(scan_ioc(client, providers, ioc, ioc_type, fname, fsize))
        results = await asyncio.gather(*tasks)

    return list(results)
