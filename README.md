# Pediatric Care Platform

A desktop application for pediatric clinical decision support — an AI symptom checker, a symptom→disease knowledge graph, clinical workflows (doctors, appointments, medical records), and an age-based growth-stages tracker, in one local-first app.

Built by merging two prior projects: **Medical-Research** (the *brain* — intelligence, data, compliance) and **Pediatrics** (the *body* — clinical workflows). See [`docs/merge-rationale.md`](docs/merge-rationale.md).

> ⚠️ **Decision-support prototype on SYNTHETIC data. NOT a medical device, NOT for real diagnosis.** See [Security & Disclaimer](#security--disclaimer).

---

## The merge story

The two predecessors were complementary layers of the same product. Neither shipped as a unified web/desktop app; this repo is that unification.

| Layer | Parent project | Was | Contributed |
|-------|----------------|-----|-------------|
| **Brain** — intelligence, data, compliance | Medical-Research | A research/spec vault (no app) | AI symptom-checker, symptom→disease knowledge graph, synthetic data pipeline, HIPAA/GDPR compliance framework |
| **Body** — clinical workflows | Pediatrics | A Flutter mobile app | Doctors, appointments (with conflict detection), medical records, growth-stages feature |

Mobile is explicitly out of scope. The product target is web/desktop.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Tauri v2 (desktop shell)                                  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Next.js 15 + React 19 + Tailwind 4 (static export)   │ │
│  │  Dashboard · Symptom Checker · Appointments ·         │ │
│  │  Doctors · Growth Stages   →   web/lib/api.ts (client) │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────┬────────────────────────────┘
                                 │ HTTP (localhost:8000)
                                 ▼
┌──────────────────────────────────────────────────────────┐
│  FastAPI (Python 3.12, Pydantic 2)  —  backend sidecar     │
│  routers: intelligence · clinical                          │
│  services: predictor · knowledge_graph · stages · store    │
└───────┬───────────────────────┬───────────────────┬────────┘
        ▼                       ▼                   ▼
   ┌─────────┐          ┌──────────────┐      ┌──────────┐
   │  Neo4j  │          │  store        │      │   LLM    │
   │ (opt.;  │          │ (SQLite /     │      │ ollama / │
   │ CSV     │          │  Postgres /   │      │ claude — │
   │ in-mem  │          │  in-memory)   │      │ explain  │
   │ fallback)│         └──────────────┘      │ only)    │
   └─────────┘                                └──────────┘
```

- **Knowledge graph** loads from `data/symptom_disease.csv` into an in-memory graph when `NEO4J_URI` is unset; point it at Neo4j to scale.
- **Store** is an in-memory repository today, swappable for SQLite (default) or Postgres via `DATABASE_URL`.
- **LLM** is used *only* to generate plain-language explanations and degrades gracefully when no provider is reachable.

---

## Features

- **AI symptom checker** — enter symptoms (+ optional age in months); get ranked disease predictions with matched symptoms, a triage level, and a plain-language explanation.
- **Triage** — every prediction returns `self-care`, `see-doctor`, or `urgent`. Red-flag symptoms (difficulty breathing, chest pain, seizure, …) escalate to `urgent`.
- **Knowledge graph explorer** — query any symptom or disease node and see its related nodes, relations, and edge weights.
- **Transparent predictor** — weighted symptom-overlap over the knowledge graph, behind a model-agnostic interface (a GNN can be swapped in without touching the API).
- **Doctors** — directory with specialty and available days.
- **Appointments** — book against a doctor; conflict detection returns `409` on overlap.
- **Medical records** — per-subject records, FHIR-style subject reference.
- **Growth stages** — map an age in months to a developmental stage, expected milestones, and red flags.
- **Provider-switchable LLM** — Ollama (free, local) by default; Claude (`claude-opus-4-8`) when configured.

Full per-feature status and provenance: [`FEATURES.md`](FEATURES.md).

---

## Tech stack

| Area | Choice | Notes |
|------|--------|-------|
| Desktop shell | Tauri v2 | Wraps the static Next.js export |
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TypeScript 5.6 | Static export |
| Backend | FastAPI, Python 3.12, Pydantic 2 | Runs as a sidecar at `:8000`, docs at `/docs` |
| Knowledge graph | Neo4j (optional) | In-memory CSV fallback when `NEO4J_URI` unset |
| Relational store | SQLite (default) / Postgres via `DATABASE_URL` | Currently an in-memory store |
| LLM | `PROVIDER=ollama` (default, `llama3.1:8b`) or `claude` (`claude-opus-4-8`, needs `ANTHROPIC_API_KEY`) | Explanations only; degrades gracefully |
| Vector DB | Chroma | Reserved for future RAG over guidelines (not yet wired) |

---

## Quick start

### Backend
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/generate_data.py        # generates data/symptom_disease.csv (10 diseases, synthetic)
uvicorn app.main:app --reload          # http://localhost:8000  (interactive docs at /docs)
```

### Frontend (web)
```bash
cd web
npm install
npm run dev                            # http://localhost:3000
```

### Desktop
```bash
cd web
npm run tauri dev
```

`Makefile` targets exist for the common flows — see the Makefile.

#### Environment
Copy `.env.example` and set as needed. Key vars: `PROVIDER` (`ollama`|`claude`), `ANTHROPIC_API_KEY` (for `claude`), `NEO4J_URI` (enable Neo4j), `DATABASE_URL` (enable Postgres).

---

## API

Base URL: `http://localhost:8000`. Interactive OpenAPI docs at `/docs`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | `{status, version, provider, graph_loaded, diseases}` |
| `POST` | `/predict` | `{symptoms[], age_months?, explain?}` → `{predictions[{disease, confidence, matched_symptoms}], triage, explanation, disclaimer}` |
| `GET`  | `/graph/{node}` | `{node, related[{name, relation, weight}]}` for a symptom or disease node |
| `GET`  | `/doctors` | `[{id, name, specialty, available_days}]` |
| `POST` | `/appointments` | `{patient_id, doctor_id, start(ISO), reason?}` → `201` Appointment, `409` on conflict |
| `GET`  | `/appointments?patient_id=…` | `[Appointment]` |
| `GET`  | `/records/{subject}` | `[MedicalRecord]` |
| `POST` | `/records` | → `201` MedicalRecord |
| `GET`  | `/stages/{age_months}` | `{age_months, stage, expected[{age_months, domain, milestone}], red_flags[]}` |

Triage values: `self-care` | `see-doctor` | `urgent`. Every `/predict` response carries a `disclaimer`.

---

## Project layout

```
pediatric-care-platform/
├── app/                      # FastAPI backend
│   ├── config.py             # settings (PROVIDER, NEO4J_URI, DATABASE_URL, …)
│   ├── schemas.py            # Pydantic 2 models
│   ├── providers.py          # LLM provider abstraction (ollama | claude)
│   ├── security.py           # compliance hooks (consent, encryption, audit, RBAC, erasure — stubbed)
│   ├── observability.py      # logging / metrics
│   ├── main.py               # app factory, router wiring
│   ├── routers/
│   │   ├── intelligence.py   # /health, /predict, /graph
│   │   └── clinical.py       # /doctors, /appointments, /records, /stages
│   └── services/
│       ├── knowledge_graph.py # CSV/Neo4j-backed graph
│       ├── predictor.py       # weighted symptom-overlap (model-agnostic)
│       ├── stages.py          # growth-stage lookups
│       └── store.py           # repository-pattern data store
├── data/symptom_disease.csv   # generated synthetic data (10 diseases)
├── scripts/generate_data.py   # synthetic data generator
├── eval/                      # evaluation harness
├── tests/                     # pytest suite
├── web/                       # Next.js 15 frontend
│   ├── lib/api.ts             # typed API client
│   └── src-tauri/             # Tauri v2 desktop config
├── specs/                     # one Feature Spec per feature
├── docs/                      # full doc set — see docs/README.md (catalog)
├── Dockerfile · docker-compose.yml · Makefile · pyproject.toml
└── README.md · FEATURES.md · CHANGELOG.md · CONTRIBUTING.md · GLOSSARY.md · CLAUDE.md
```

---

## Documentation

Full catalog with priority tiers: **[`docs/README.md`](docs/README.md)**.

| Area | Start here |
|---|---|
| Product & scope | [`docs/PRD.md`](docs/PRD.md) · [`docs/roadmap.md`](docs/roadmap.md) · [`docs/feature-backlog.md`](docs/feature-backlog.md) |
| UI / UX | [`docs/ui-ux-spec.md`](docs/ui-ux-spec.md) |
| Engineering | [`docs/architecture.md`](docs/architecture.md) · [`docs/data-model.md`](docs/data-model.md) · [`docs/api-reference.md`](docs/api-reference.md) · [`docs/adr/`](docs/adr/) |
| Quality | [`docs/test-strategy.md`](docs/test-strategy.md) · [`docs/definition-of-done.md`](docs/definition-of-done.md) |
| Specs | [`specs/`](specs/) — one per feature |
| Security & compliance | [`SECURITY.md`](SECURITY.md) · [`docs/threat-model.md`](docs/threat-model.md) · [`docs/privacy-compliance.md`](docs/privacy-compliance.md) · [`docs/incident-response.md`](docs/incident-response.md) |
| Operations | [`docs/deployment.md`](docs/deployment.md) · [`docs/runbook.md`](docs/runbook.md) · [`docs/release-process.md`](docs/release-process.md) · [`docs/monitoring-observability.md`](docs/monitoring-observability.md) · [`docs/disaster-recovery.md`](docs/disaster-recovery.md) · [`docs/accessibility.md`](docs/accessibility.md) |

---

## Security & disclaimer

**This is a decision-support prototype trained and demonstrated on SYNTHETIC data. It is NOT a medical device and MUST NOT be used for real diagnosis or treatment.**

Before this system accepts real Protected Health Information (PHI), the following must be implemented (hooks are stubbed in `app/security.py`):

| Control | Why |
|---------|-----|
| Consent capture | Lawful basis for processing (GDPR Art. 6/9) |
| Field-level encryption | Protect PHI at rest |
| Audit logging | HIPAA accountability; tamper-evident access trail |
| Data-retention policy | Limit how long PHI is kept |
| RBAC | Least-privilege access by clinical role |
| GDPR right-to-erasure | Honor deletion requests |

**Fresh git history.** The predecessor Medical-Research repo had secrets committed to its git history. This repo was created with a **fresh git history**, so none of those secrets carried over.

---

## Roadmap

- Wire Chroma + RAG over clinical guidelines to ground explanations.
- Swap the weighted-overlap predictor for a trained GNN behind the same interface.
- Implement the `app/security.py` compliance controls for a real-PHI pilot.
- Persistent store: promote SQLite/Postgres from the in-memory default.
- Package signed desktop builds (Tauri) for Linux/macOS/Windows.

---

Built by merging **Medical-Research** + **Pediatrics** into one web/desktop product.

## License

MIT
