from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ── Request models ────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    iocs: list[str] = Field(..., min_length=1, description="List of IOC strings to scan")


class TextScanRequest(BaseModel):
    text: str = Field(..., description="Raw pasted text; split on newlines/commas")


# ── Provider result ───────────────────────────────────────────────────────────

class ProviderResult(BaseModel):
    provider: str
    ioc: str
    ioc_type: str
    success: bool
    error: str | None = None
    malicious: int | None = None
    suspicious: int | None = None
    harmless: int | None = None
    undetected: int | None = None
    detection_ratio: str | None = None   # e.g. "12/70"
    raw: dict[str, Any] = {}


# ── Scan result (enriched with risk score) ───────────────────────────────────

class ScanResult(BaseModel):
    id: int | None = None
    ioc: str
    ioc_type: str
    risk_score: float | None = None
    risk_band: str | None = None          # Low / Medium / High
    detection_ratio: str | None = None
    status: str = "completed"
    tag: str | None = None
    source_filename: str | None = None
    file_size: int | None = None
    created_at: datetime | None = None
    provider_results: list[ProviderResult] = []


# ── History / tag update ──────────────────────────────────────────────────────

class TagUpdate(BaseModel):
    tag: str | None = Field(None, description="Malware | Phishing | Investigation | False Positive | null to clear")


class ScanHistoryItem(BaseModel):
    id: int
    ioc: str
    ioc_type: str
    risk_score: float | None
    risk_band: str | None
    detection_ratio: str | None
    status: str
    tag: str | None
    source_filename: str | None
    file_size: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScanDetail(ScanHistoryItem):
    provider_results: list[ProviderResult] = []


# ── Settings response ─────────────────────────────────────────────────────────

class ProviderStatus(BaseModel):
    name: str
    enabled: bool
    key_hint: str | None = None   # e.g. "VT...XXXX" masked


class SettingsResponse(BaseModel):
    providers: list[ProviderStatus]
    max_upload_mb: int
    max_iocs_per_scan: int


class ApiKeyUpdate(BaseModel):
    virustotal_api_key: str | None = None   # None = leave unchanged; "" = clear
    abuseipdb_api_key: str | None = None


# ── File scan response ────────────────────────────────────────────────────────

class FileHashInfo(BaseModel):
    filename: str
    size: int
    md5: str
    sha1: str
    sha256: str


class FileScanResult(BaseModel):
    file_info: FileHashInfo
    scan_result: ScanResult
