"""Scan history endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.crud import get_scan, get_stats, hydrate_provider_results, list_scans
from app.database.db import get_db
from app.models.schemas import ScanDetail, ScanHistoryItem

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[ScanHistoryItem])
async def get_history(db: AsyncSession = Depends(get_db)):
    """Return all scans ordered by newest first."""
    scans = await list_scans(db)
    return [
        ScanHistoryItem(
            id=s.id,
            ioc=s.ioc,
            ioc_type=s.ioc_type,
            risk_score=s.risk_score,
            risk_band=s.risk_band,
            detection_ratio=s.detection_ratio,
            status=s.status,
            tag=s.tag,
            source_filename=s.source_filename,
            file_size=s.file_size,
            created_at=s.created_at,
        )
        for s in scans
    ]


@router.get("/stats", response_model=dict)
async def history_stats(db: AsyncSession = Depends(get_db)):
    """Aggregate counts for the dashboard."""
    return await get_stats(db)


@router.get("/{scan_id}", response_model=ScanDetail)
async def get_scan_detail(scan_id: int, db: AsyncSession = Depends(get_db)):
    """Return full scan detail including per-provider results."""
    scan = await get_scan(db, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found")

    provider_results = hydrate_provider_results(scan)

    return ScanDetail(
        id=scan.id,
        ioc=scan.ioc,
        ioc_type=scan.ioc_type,
        risk_score=scan.risk_score,
        risk_band=scan.risk_band,
        detection_ratio=scan.detection_ratio,
        status=scan.status,
        tag=scan.tag,
        source_filename=scan.source_filename,
        file_size=scan.file_size,
        created_at=scan.created_at,
        provider_results=provider_results,
    )
