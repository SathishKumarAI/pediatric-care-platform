# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Auth & accounts (PCP-8): `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`. PBKDF2-HMAC-SHA256 password hashing (stdlib) + opaque token sessions in a `sessions` table; `users` table; `Role`-typed accounts. New `/login` page, auth context, token-aware API client (sends `Authorization: Bearer`), and a sidebar account badge. `get_current_user` dependency is in place for RBAC (PCP-14). Spec at `specs/auth.md`.
- Growth milestone timeline chart on the stages page — an SVG plotting milestones by age with a current-age marker; age prefills from the active child (PCP-11). (True height/weight percentile curves split out to PCP-18, which needs measurement capture + WHO/CDC reference data.)
- Appointment cancel / reschedule: `PATCH /appointments/{id}` (cancel frees the slot; reschedule re-checks conflicts) with cancel/reschedule buttons in the UI (PCP-9).
- Doctor availability enforcement: booking or rescheduling on a day the doctor doesn't work is rejected with 409 (PCP-10).

### Planned
- PCP-8 Auth & accounts (signup/login/roles) — v0.5 Clinical depth.
- Wire Chroma + RAG over clinical guidelines.
- Swap the weighted-overlap predictor for a trained GNN behind the existing interface.
- Implement `app/security.py` compliance controls (consent, encryption, audit, retention, RBAC, erasure).
- Signed Tauri desktop installers + auto-update.

## [0.2.0] — 2026-06-24

v0.2 Foundations milestone (PCP-1 … PCP-7): persistence, child profiles + active-child context, frontend test stack, and UI state/validation polish.

### Added
- Form validation with inline field errors: patients form (name required, no future birth date) and appointment past-time guard (PCP-7).
- Shared loading / empty / error UI components with accessibility roles + retry, applied across doctors, records, appointments, and patients pages (PCP-6).
- Symptom checker can save a result (triage + top predictions) to the active child's medical record (PCP-5).
- Patient / child profiles (PCP-4): `POST`/`GET /patients`, `GET /patients/{id}` with persisted profiles and a computed `age_months`. New `/patients` (Children) page; a client-side active-child context (localStorage) now drives appointments (replaces hardcoded `p1`), the records subject, and the symptom-checker age. Spec at `specs/patients.md`.
- Frontend testing: Vitest + Testing Library (api-client + Doctors-page tests, run in CI via `npm run test`) and Playwright e2e smoke (`web/e2e/smoke.spec.ts`, `npm run test:e2e`) (PCP-3).
- Persistent SQLite store (`app/services/{db,store}.py`): records and appointments now survive restart. `InMemoryStore` and `SqliteStore` sit behind one interface, selected by `DATABASE_URL` (PCP-1).
- Test isolation via `tests/conftest.py` (throwaway per-session SQLite DB) + persistence-across-restart test.
- Medical Records UI (`web/app/records/page.tsx`): view a patient's append-only records by ID and add clinical notes with optional attachment refs (PCP-2).
- `records` / `addRecord` methods + `MedicalRecord` type in the typed API client.
- Backend tests for `POST`/`GET /records`.
- `docs/TICKETS.md` live build backlog; `docs/WORKLOG.md` append-only session log.

### Changed
- `app/services/store.py` refactored into `InMemoryStore` + `SqliteStore` (was a single in-memory class). `Store` kept as a backwards-compatible alias.
- Enums (`Role`, `Sex`, `AppointmentStatus`) now use `enum.StrEnum`; `datetime.UTC` alias — project-wide `ruff check` clean.

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
