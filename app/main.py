"""FastAPI entrypoint for the Pediatric Care Platform.

One service, two merged layers:
  - intelligence/  symptom checker + knowledge graph   (ex Medical-Research)
  - clinical/       doctors, appointments, records, stages  (ex Pediatrics)

Run: uvicorn app.main:app --reload
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from . import __version__
from .config import get_settings
from .observability import configure_logging, logger, metrics, now_ms
from .routers import auth, clinical, intelligence
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

@app.middleware("http")
async def observe(request: Request, call_next):
    start = now_ms()
    response = await call_next(request)
    dur = now_ms() - start
    route = request.scope.get("route")
    route_path = getattr(route, "path", request.url.path)
    metrics.record(request.method, route_path, response.status_code, dur)
    logger.info("%s %s -> %s %.1fms", request.method, route_path, response.status_code, dur)
    response.headers["X-Response-Time-ms"] = f"{dur:.1f}"
    return response


app.include_router(auth.router)
app.include_router(intelligence.router)
app.include_router(clinical.router)


@app.get("/metrics", tags=["meta"], response_class=PlainTextResponse)
def prometheus_metrics() -> str:
    return metrics.prometheus()


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
