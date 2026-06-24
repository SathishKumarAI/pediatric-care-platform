# Features

Every feature, the parent project it came from, and its current status.

**Status legend:** `done` = built and tested · `stub` = scaffolded/hook present, not implemented · `planned` = not started.

## Intelligence (from Medical-Research — the "brain")

| Feature | Endpoint / location | Status | Notes |
|---------|--------------------|--------|-------|
| AI symptom checker | `POST /predict` | done | Ranked predictions + triage + explanation |
| Triage classification | `/predict` → `triage` | done | `self-care` / `see-doctor` / `urgent`; red-flag escalation |
| Symptom→disease knowledge graph | `app/services/knowledge_graph.py`, `GET /graph/{node}` | done | In-memory from CSV; Neo4j optional |
| Transparent predictor | `app/services/predictor.py` | done | Weighted symptom-overlap; model-agnostic interface |
| Synthetic data pipeline | `scripts/generate_data.py` → `data/symptom_disease.csv` | done | 10 diseases, synthetic |
| Plain-language explanations | `app/providers.py` | done | LLM-generated; degrades gracefully if no LLM |
| Provider abstraction (ollama / claude) | `app/providers.py`, `PROVIDER` env | done | Default `ollama` (`llama3.1:8b`); `claude` = `claude-opus-4-8` |
| Health / readiness | `GET /health` | done | Reports `provider`, `graph_loaded`, `diseases` |
| HIPAA/GDPR compliance framework | `app/security.py` | stub | Consent, encryption, audit, retention, RBAC, erasure hooks |
| GNN predictor | `app/services/predictor.py` interface | planned | Swap in behind the model-agnostic interface |
| Neo4j-backed graph at scale | `knowledge_graph.py` | done (optional) | Activated when `NEO4J_URI` is set; CSV fallback otherwise |
| RAG over clinical guidelines (Chroma) | — | planned | Vector DB reserved, not yet wired |

## Clinical workflows (from Pediatrics — the "body")

| Feature | Endpoint / location | Status | Notes |
|---------|--------------------|--------|-------|
| Doctors directory | `GET /doctors` | done | `{id, name, specialty, available_days}` |
| Book appointment | `POST /appointments` | done | `201` on success |
| Appointment conflict detection | `POST /appointments` | done | `409` on overlapping slot |
| List appointments | `GET /appointments?patient_id=…` | done | Filtered by patient |
| Medical records (read) | `GET /records/{subject}` | done | FHIR-style subject reference |
| Medical records (create) | `POST /records` | done | `201` |
| Growth stages | `GET /stages/{age_months}` | done | Stage + expected milestones + red flags |
| Persistent relational store | `app/services/store.py` | stub | Repository pattern; in-memory now, SQLite/Postgres planned |

## Frontend / desktop (new — unifies both layers)

| Feature | Location | Status | Notes |
|---------|----------|--------|-------|
| Dashboard page | `web/` | done | Entry view |
| Symptom Checker page | `web/` | done | Calls `/predict` |
| Appointments page | `web/` | done | `/doctors`, `/appointments` |
| Doctors page | `web/` | done | `/doctors` |
| Growth Stages page | `web/` | done | `/stages/{age_months}` |
| Typed API client | `web/lib/api.ts` | done | Typed wrapper over backend |
| Tauri v2 desktop shell | `web/src-tauri/` | done | Wraps the static export |
| Signed desktop installers | — | planned | Linux/macOS/Windows builds |

## Dropped (not carried over from parents)

| Dropped | From | Replaced by |
|---------|------|-------------|
| Flutter mobile app | Pediatrics | Next.js + Tauri web/desktop |
| Firebase backend | Pediatrics | FastAPI + store |
| Spec-only vault (no runtime) | Medical-Research | Live FastAPI services |
