# Architecture

How the Pediatric Care Platform is put together, and where to change it. The system is a two-layer merge: an intelligence/compliance layer (from Medical-Research) and a clinical-workflow layer (from Pediatrics), unified behind one FastAPI backend and one Next.js/Tauri frontend.

## The two-layer merge

| Layer | Responsibility | Modules |
|-------|----------------|---------|
| **Brain** (intelligence) | Symptom checking, knowledge graph, triage, LLM explanations, compliance | `routers/intelligence.py`, `services/{predictor,knowledge_graph}.py`, `providers.py`, `security.py` |
| **Body** (workflows) | Doctors, appointments, records, growth stages | `routers/clinical.py`, `services/{store,stages}.py` |

The two layers share the same process and store but stay in separate routers/services so each can evolve independently.

## Component diagram

```
 Tauri v2 desktop shell
        │ launches + serves
        ▼
 Next.js 15 static export ──────────────────────────────────┐
   pages: Dashboard, Symptom Checker, Appointments,          │
          Doctors, Growth Stages                             │
   web/lib/api.ts (typed client)                             │
        │ HTTP                                               │
        ▼                                                    │
 FastAPI app (app/main.py)                                   │
   ├── routers/intelligence.py → /health /predict /graph     │
   └── routers/clinical.py     → /doctors /appointments      │
                                  /records /stages           │
        │            │              │            │           │
        ▼            ▼              ▼            ▼            │
   predictor    knowledge_graph   store        stages        │
        │            │              │                        │
        │            ▼              ▼                        │
        │      Neo4j | CSV     in-memory | SQLite | Postgres │
        ▼                                                    │
   providers.py ── ollama | claude (explanations only) ──────┘
```

Cross-cutting: `config.py` (settings from env), `schemas.py` (Pydantic 2 request/response models), `observability.py` (logging/metrics), `security.py` (compliance hooks).

## Data flow: a symptom-check request

```
1. UI (Symptom Checker page)
     → web/lib/api.ts POSTs {symptoms[], age_months?, explain?}

2. POST /predict  (routers/intelligence.py)
     → validates body against schemas.PredictRequest

3. predictor.predict(symptoms, age_months)
     → reads edges from knowledge_graph for each input symptom
     → scores candidate diseases by weighted symptom-overlap
     → returns ranked predictions + matched_symptoms

4. Triage
     → if any input symptom is a red flag → "urgent"
     → else derive "self-care" / "see-doctor" from scores

5. (if explain) providers.explain(predictions, triage)
     → calls the active LLM (ollama|claude) for plain-language text
     → on any failure, returns a safe fallback string (graceful degrade)

6. Response (schemas.PredictResponse)
     → {predictions, triage, explanation, disclaimer}
     → disclaimer is always attached
```

Steps 3–4 are deterministic and explainable; step 5 is best-effort and never blocks a response.

## Key abstractions

### Repository-pattern store (`services/store.py`)
All clinical persistence (doctors, appointments, records) goes through one repository interface. The default implementation is in-memory. Because callers depend on the interface — not the backend — swapping storage is a single-module change.

**Swap to SQLite/Postgres:** implement the repository interface against the DB, select it in `config.py` based on `DATABASE_URL` (SQLite when unset, Postgres when a URL is present). Routers and services are untouched.

### Provider abstraction (`providers.py`)
The LLM is reached only through a provider interface. `PROVIDER=ollama` (default, `llama3.1:8b`) or `PROVIDER=claude` (`claude-opus-4-8`, requires `ANTHROPIC_API_KEY`). Explanations are non-essential: any provider error returns a fallback so `/predict` always succeeds.

**Swap/extend providers:** add an implementation conforming to the provider interface and register it; selection is by the `PROVIDER` env var.

### Knowledge graph (`services/knowledge_graph.py`)
Loads `data/symptom_disease.csv` into an in-memory graph at startup when `NEO4J_URI` is unset. Nodes are symptoms/diseases; edges are typed (`HAS_SYMPTOM`, `INDICATES`, `TREATS`) and weighted.

**Swap to Neo4j:** set `NEO4J_URI` (+ credentials). The module routes graph reads to Neo4j instead of the in-memory structure; the predictor's graph queries are unchanged.

### Predictor (`services/predictor.py`)
Default scorer is transparent weighted symptom-overlap over the graph. It implements a model-agnostic interface so a learned model (e.g. a GNN) can replace it without changing `/predict` or the response schema.

**Swap to a real ML model:** implement the predictor interface (same input/output contract), load weights at startup, and register it. The API contract and the triage step stay the same.

## How to swap things in

| Want | Do | Touch points |
|------|----|--------------|
| Neo4j graph | Set `NEO4J_URI` (+ creds) | `knowledge_graph.py`, env only |
| Trained ML / GNN predictor | Implement predictor interface, register | `predictor.py` only |
| Postgres | Set `DATABASE_URL`, implement repo | `store.py`, `config.py` |
| Claude explanations | `PROVIDER=claude`, set `ANTHROPIC_API_KEY` | env only |
| RAG over guidelines | Wire Chroma into `providers.py` explanation path | `providers.py` (planned) |

## Scalability notes

- **Stateless backend.** The FastAPI app holds no per-request state beyond the store, so it scales horizontally behind a load balancer once the store is a shared DB (Postgres) rather than in-memory.
- **Graph.** In-memory CSV is fine for the synthetic 10-disease dataset; a real catalogue needs Neo4j, which moves graph queries off-process and supports indexing.
- **LLM.** Explanations are the only LLM call and they are best-effort and cacheable by `(predictions, triage)`; they are not on the critical path for a prediction.
- **Desktop vs. server.** As a Tauri desktop app, the backend runs as a local sidecar (single user, in-memory store is adequate). For a multi-user server deployment, switch to Postgres + Neo4j and run the FastAPI app as a normal service (see `docker-compose.yml`).
- **Compliance gate.** Any multi-user / real-PHI deployment must implement the `security.py` controls (consent, encryption, audit, retention, RBAC, erasure) before going live.
