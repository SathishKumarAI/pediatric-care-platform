# Roadmap — Prototype → Production

**Where we are:** v0.1 (merged MVP) is **done** — all core endpoints exist and pass tests, web + Tauri shell work, data is synthetic and in-memory. The road to v1.0 is about **persistence, identity, a real model, and compliance going live**.

**Priority tags:** `Core` = must-have for the phase · `Growing` = strong value, fast-follow · `Heavy` = large/expensive, deliberately deferred.

> Status is honest: anything not yet built is **planned**. Compliance is a hook (`app/security.py`), not a control.

---

## v0.1 — Merged MVP *(done)*

The two parent projects are now one service: intelligence (symptom checker + knowledge graph) + clinical (doctors, appointments, records, stages).

| Milestone | Priority | Status |
|-----------|----------|--------|
| FastAPI service with merged routers (`intelligence`, `clinical`) | Core | done |
| AI symptom checker `POST /predict` (predictions + triage + explanation) | Core | done |
| Triage with red-flag escalation to `urgent` | Core | done |
| Knowledge graph neighbor query `GET /graph/{node}` (in-memory from CSV) | Core | done |
| Doctors / appointments (409 conflict) / records / stages endpoints | Core | done |
| Env-switchable LLM (`ollama` default / `claude`), graceful no-LLM fallback | Core | done |
| Next.js 15 / React 19 / Tailwind 4 web pages + typed API client | Core | done |
| Tauri v2 desktop shell | Core | done |
| pytest suite green; eval harness present | Core | done |

**Exit criteria (met):** all listed endpoints implemented, tests pass, web pages call the live API, synthetic data loads.

---

## v0.2 — Foundations for real data

**Theme:** make data durable and the app multi-user-ready. Nothing leaves "synthetic only" yet.

| Milestone | Priority | Status | Depends on |
|-----------|----------|--------|------------|
| Persistent store: SQLite → Postgres via `DATABASE_URL` (repository pattern already in `store.py`) | Core | planned | — |
| DB migrations (Alembic) | Core | planned | persistence |
| Auth: signup / login / sessions | Core | planned | persistence |
| Role model enforced (patient/guardian/doctor/admin/researcher) | Core | planned | auth |
| Symptom-check history + save-to-record | Growing | planned | persistence, auth |
| Free-text symptom entry + symptom search/autocomplete | Growing | planned | — |
| Eval dashboard for predictor accuracy | Growing | planned | eval harness |
| Signed desktop installers (Linux/macOS/Windows) | Growing | planned | Tauri shell |

**Exit criteria:** data survives restart; users authenticate; roles gate access; CI runs tests on every PR.

---

## v0.5 — Clinical depth

**Theme:** the workflows real clinics need day to day.

| Milestone | Priority | Status | Depends on |
|-----------|----------|--------|------------|
| Appointments: cancel / reschedule / reminders / calendar view | Core | planned | persistence, auth |
| Doctor availability / working-hours model | Core | planned | persistence |
| Medical records: timeline view + attachments | Core | planned | persistence |
| Growth: per-child tracking + percentile charts + milestone check-off | Core | planned | persistence |
| FHIR import/export of records | Growing | planned | persistence |
| Notifications: in-app + email | Growing | planned | auth |
| Real ML model behind the model-agnostic interface (GNN) | Heavy | planned | eval, data |
| Neo4j-backed graph at scale | Heavy | planned (optional path exists) | — |
| Body-map symptom UI + age-aware weighting refinements | Growing | planned | symptom checker |

**Exit criteria:** a clinician can manage a real schedule and patient history (synthetic); growth charts render per child; model swap validated by eval.

---

## v1.0 — Production

**Theme:** safe to handle real data; shippable.

| Milestone | Priority | Status | Depends on |
|-----------|----------|--------|------------|
| Compliance controls **live**: consent, field encryption, audit log, retention, RBAC, GDPR erasure | Core | planned (hooks only) | auth, persistence |
| Hardened auth: password reset, email verification, OAuth, account deletion | Core | planned | auth |
| Confidence calibration + AI guardrails/disclaimers reviewed | Core | planned | real model |
| Error reporting + analytics/telemetry (privacy-respecting) | Core | planned | — |
| Accessibility (WCAG) + i18n/localization scaffolding | Growing | planned | — |
| Offline support (desktop) for core flows | Growing | planned | persistence |
| Admin dashboard | Growing | planned | auth, RBAC |
| Onboarding/welcome + help/FAQ | Growing | planned | — |

**Exit criteria:** compliance controls enforced (not stubbed), security review passed, signed installers published, accessibility baseline met. **Only then** may non-synthetic data be considered.

---

## Later — Care platform

| Capability | Priority | Notes |
|------------|----------|-------|
| Telehealth / video visits | Heavy | needs media infra + compliance |
| Doctor–patient messaging/chat + attachments | Heavy | consent + audit |
| Payments: checkout, invoices, insurance | Heavy | regulatory + PCI scope |
| Multi-language symptom checker | Growing | i18n + NLP |
| Researcher tooling (de-identified datasets, graph admin UI) | Growing | RBAC + de-identification |
| RAG over clinical guidelines | Heavy | vector DB reserved, not wired |
