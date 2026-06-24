# Monitoring & Observability

> **Current state:** basic structured logging only. `app/observability.py` configures `logging.basicConfig` (level, timestamp, logger, message) — nothing else. Everything below labelled *planned* is not built.
>
> Why it matters here: this is a **health decision-support tool**. A silently-wrong prediction or a down API is a safety/trust issue, not just a uptime metric — so observability is about *correctness and availability*, not vanity dashboards.

## Current vs target

| Capability | Today | Target | Tag |
|---|---|---|---|
| Structured logging | `logging.basicConfig`, plain text to stdout | JSON logs (request id, latency, provider, outcome) | Core |
| Health probe | `GET /health` exists | Keep; add `/ready` distinct from `/health` | Core |
| Request/error logging | none beyond uvicorn access log | Per-request middleware: method, path, status, duration | Core |
| Audit log | `app/security.py` `record_access()` placeholder (no callers) | Append-only audit trail before any PHI | Growing |
| Metrics | none | Prometheus `/metrics` or OpenTelemetry counters/histograms | Growing |
| Distributed tracing | none | OpenTelemetry spans (API → predictor → LLM provider) | Heavy |
| Error tracking | none | Sentry (backend + desktop renderer) | Growing |
| Dashboards | none | Grafana / hosted equivalent | Heavy |
| Alerting | none | Alertmanager / PagerDuty on SLO burn | Heavy |
| Desktop telemetry | none | Opt-in crash/usage reporting (privacy-reviewed) | Heavy |

## Health & readiness probes

`GET /health` returns:
```json
{ "status": "ok", "version": "0.1.0", "provider": "ollama",
  "graph_loaded": true, "diseases": 10 }
```
| Probe | Use | Status |
|---|---|---|
| `GET /health` | Liveness + quick sanity (graph loaded, disease count) | Built |
| `GET /ready` | Gate traffic until dependencies (DB/graph/provider) are reachable | Planned — today `/health` doubles as readiness |

> A green `/health` does **not** mean the LLM provider is reachable — providers degrade gracefully (`app/providers.py`), so add a provider-reachability check to readiness if explanations must be live.

## Key SLIs / SLOs

Define on the **backend service** (the desktop shell's reliability is mostly its ability to reach this API).

| SLI | What / how | Proposed SLO | Why |
|---|---|---|---|
| API availability | non-5xx `/predict`,`/appointments`,etc. ÷ total | 99.5% monthly | Core clinical workflows must be reachable |
| Prediction latency | p95 server time for `POST /predict` (with `explain=false`) | p95 < 300 ms | Predictor is local/CPU; LLM-free path should be fast |
| Explanation latency | p95 `POST /predict` with `explain=true` | p95 < 8 s | Bounded by LLM (Ollama/Claude, 60 s client timeout) — degradation, not failure |
| API error rate | 5xx ÷ total requests | < 0.5% | 4xx (e.g. `409`, `422`) are expected client errors, exclude them |
| Prediction correctness | eval accuracy (`eval/run_eval.py`) | track per release; alert on regression | Safety: a worse model must not ship (CI gate) |

> Distinguish expected 4xx from real failures: `409` (appointment conflict), `422` (no symptoms / bad age), `404` (no graph node) are **normal** and must not page anyone.

## Implementation path (suggested order)

1. **Core** — request-logging middleware (JSON, latency, request id); split `/ready` from `/health`.
2. **Growing** — Prometheus client → `/metrics` (request count, latency histogram, prediction count by triage level, provider-fallback counter); Sentry SDK on backend + Tauri renderer.
3. **Heavy** — OpenTelemetry tracing across API→predictor→provider; Grafana dashboards; alerting on SLO burn-rate.

## Dashboards & alerts (planned targets)

| Dashboard | Panels |
|---|---|
| Service health | Availability, request rate, error rate, p50/p95/p99 latency |
| Prediction quality | Eval accuracy trend, triage-level distribution, provider-fallback rate |
| Dependencies | LLM provider reachability, DB/Neo4j up, fallback frequency |

| Alert | Condition | Severity |
|---|---|---|
| API down | `/health` failing or 5xx rate > 5% for 5 min | Page |
| Latency burn | p95 `/predict` > SLO for 10 min | Warn |
| Provider degraded | fallback rate > 25% for 15 min | Warn (not page — graceful) |
| Eval regression | release eval accuracy below prior baseline | Block release (CI), notify |
