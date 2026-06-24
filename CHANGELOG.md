# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Wire Chroma + RAG over clinical guidelines.
- Swap the weighted-overlap predictor for a trained GNN behind the existing interface.
- Implement `app/security.py` compliance controls (consent, encryption, audit, retention, RBAC, erasure).
- Promote the in-memory store to persistent SQLite/Postgres.
- Signed Tauri desktop installers.

## [0.1.0] — 2026-06-24

Initial merged release. Unifies the prior **Medical-Research** (intelligence/data/compliance) and **Pediatrics** (clinical workflows) projects into a single web/desktop application. Built with a fresh git history — no secrets from the predecessor repos carried over.

### Added

**Backend (FastAPI, Python 3.12, Pydantic 2)**
- `GET /health` — status, version, active LLM provider, graph-loaded flag, disease count.
- `POST /predict` — symptom checker: ranked disease predictions, triage level, plain-language explanation, disclaimer. Optional `age_months` and `explain`.
- `GET /graph/{node}` — knowledge-graph query for any symptom or disease node.
- `GET /doctors` — doctor directory with specialty and available days.
- `POST /appointments` / `GET /appointments` — booking with conflict detection (`409` on overlap) and per-patient listing.
- `GET /records/{subject}` / `POST /records` — medical records keyed by FHIR-style subject.
- `GET /stages/{age_months}` — growth stage, expected milestones, and red flags for an age.
- Symptom→disease knowledge graph (`app/services/knowledge_graph.py`): in-memory from CSV, optional Neo4j when `NEO4J_URI` set.
- Transparent weighted symptom-overlap predictor (`app/services/predictor.py`) behind a model-agnostic interface.
- Triage with red-flag escalation (difficulty_breathing, chest_pain, seizure, …) to `urgent`.
- LLM provider abstraction (`app/providers.py`): `ollama` (default, `llama3.1:8b`) or `claude` (`claude-opus-4-8`); explanations degrade gracefully when no provider is reachable.
- Repository-pattern data store (`app/services/store.py`): in-memory default, SQLite/Postgres-ready.
- Synthetic data generator (`scripts/generate_data.py`) producing `data/symptom_disease.csv` with 10 diseases.
- Stubbed HIPAA/GDPR compliance hooks (`app/security.py`).
- Observability scaffolding (`app/observability.py`).
- Test suite (`tests/`) and evaluation harness (`eval/`).

**Frontend / Desktop**
- Next.js 15 + React 19 + Tailwind 4 app (`web/`): Dashboard, Symptom Checker, Appointments, Doctors, Growth Stages.
- Typed API client (`web/lib/api.ts`).
- Tauri v2 desktop shell (`web/src-tauri/`) wrapping the static Next.js export.

**Tooling**
- `Dockerfile`, `docker-compose.yml`, `Makefile`, `pyproject.toml`, pre-commit config.
- Documentation set: `README.md`, `FEATURES.md`, `CONTRIBUTING.md`, `GLOSSARY.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/merge-rationale.md`.

### Removed (relative to the parent projects)
- Flutter mobile app (Pediatrics) — replaced by the Next.js/Tauri web-desktop frontend.
- Firebase backend (Pediatrics) — replaced by FastAPI + the repository store.

### Security
- Repository created with fresh git history; no secrets from the Medical-Research history carried over.
- Synthetic data only. Not a medical device; not for real diagnosis.

[Unreleased]: https://example.com/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/releases/v0.1.0
