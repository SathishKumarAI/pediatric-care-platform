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
from .routers import auth, clinical, compliance, intelligence
from .services.auth import get_auth
from .services.compliance import get_compliance
from .services.knowledge_graph import get_graph

_WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

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

    # Audit every write (HIPAA/GDPR). Actor resolved from the bearer token.
    if request.method in _WRITE_METHODS:
        token = (request.headers.get("authorization") or "")[7:].strip() or None
        user = get_auth().user_for_token(token) if token else None
        actor = user.email if user else "anonymous"
        get_compliance().record_audit(actor, request.method, route_path, response.status_code)
    return response


app.include_router(auth.router)
app.include_router(intelligence.router)
app.include_router(clinical.router)
app.include_router(compliance.router)


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
