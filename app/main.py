"""FastAPI entrypoint for the Pediatric Care Platform.

One service, two merged layers:
  - intelligence/  symptom checker + knowledge graph   (ex Medical-Research)
  - clinical/       doctors, appointments, records, stages  (ex Pediatrics)

Run: uvicorn app.main:app --reload
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import get_settings
from .observability import configure_logging
from .routers import clinical, intelligence
from .services.knowledge_graph import get_graph

configure_logging()
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Merged pediatric clinical workflows + AI decision support.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intelligence.router)
app.include_router(clinical.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    g = get_graph()
    return {
        "status": "ok",
        "version": __version__,
        "provider": settings.provider,
        "graph_loaded": bool(g.diseases),
        "diseases": len(g.diseases),
    }
