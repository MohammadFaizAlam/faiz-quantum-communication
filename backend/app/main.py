"""FastAPI application entrypoint: uvicorn app.main:app --port 8123

Port 8123 avoids the common 8000/8001 range, which is frequently occupied
by other local services (WSL relay, other dev servers).
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router

app = FastAPI(
    title="BB84 Quantum Secure Communication API",
    description=(
        "Educational simulation of the BB84 quantum key distribution "
        "protocol, including intercept-resend eavesdropping, channel noise, "
        "sifting, QBER parameter estimation and a gated one-time-pad "
        "encryption stage. Software simulation of idealized polarization "
        "states -- not real quantum hardware."
    ),
    version="1.0.0",
)

# CORS configuration. Set CORS_ORIGINS to a comma-separated list of
# specific origins if you want to restrict access; defaults to "*" for easy deployment.
_raw_origins = os.environ.get("CORS_ORIGINS", "*").strip()
_origins = ["*"] if _raw_origins == "*" else [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(router)
