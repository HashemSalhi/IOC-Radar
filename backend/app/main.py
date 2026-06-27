"""Bulk-IOC-Scanner FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import history, scan, settings
from app.config import settings as cfg
from app.database.db import AsyncSessionLocal, init_db
from app.utils.logging import configure_logging

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Load any keys previously saved via the web UI into the in-memory store
    async with AsyncSessionLocal() as db:
        from app.services.keystore import keystore
        await keystore.load_from_db(db)
    yield


app = FastAPI(
    title="Bulk-IOC-Scanner",
    description="Bulk IOC threat intelligence scanner",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[cfg.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(history.router)
app.include_router(settings.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Bulk-IOC-Scanner"}
