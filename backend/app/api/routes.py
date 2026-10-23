"""API router: POST /api/simulate and GET /api/health."""

from __future__ import annotations

import os

from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from ..core.experiment import run_experiment

router = APIRouter(prefix="/api")

MAX_PHOTONS = 4096
MAX_MESSAGE_BYTES = 512


class SimulateRequest(BaseModel):
    n_photons: int = Field(
        default=256, ge=8, le=MAX_PHOTONS,
        description="Number of photons Alice sends (8-4096).",
    )
    eve_enabled: bool = Field(
        default=False, description="Enable Eve's intercept-resend attack."
    )
    interception_rate: float = Field(
        default=1.0, ge=0.0, le=1.0,
        description="Probability that Eve intercepts each photon.",
    )
    noise_rate: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Probability of a bit-flip channel error per photon.",
    )
    sample_fraction: float = Field(
        default=0.25, ge=0.0, le=1.0,
        description="Fraction of the sifted key revealed for QBER estimation.",
    )
    threshold: float = Field(
        default=0.11, gt=0.0, le=1.0,
        description="Educational abort threshold on the observed QBER.",
    )
    message: str | None = Field(
        default=None, max_length=2048,
        description="Optional plaintext for the one-time-pad demonstration.",
    )
    seed: int | None = Field(
        default=None, ge=0, le=2**32 - 1,
        description="Optional deterministic seed for reproducible runs.",
    )

    @field_validator("message")
    @classmethod
    def message_size(cls, v: str | None) -> str | None:
        if v is not None and len(v.encode("utf-8")) > MAX_MESSAGE_BYTES:
            raise ValueError(
                f"message must be at most {MAX_MESSAGE_BYTES} UTF-8 bytes")
        return v


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "bb84-api", "version": "1.0.0"}


@router.post("/simulate")
def simulate(req: SimulateRequest) -> dict:
    """Run one full BB84 experiment and return the complete result."""
    return run_experiment(
        n_photons=req.n_photons,
        eve_enabled=req.eve_enabled,
        interception_rate=req.interception_rate,
        noise_rate=req.noise_rate,
        sample_fraction=req.sample_fraction,
        threshold=req.threshold,
        message=req.message,
        seed=req.seed,
    )
