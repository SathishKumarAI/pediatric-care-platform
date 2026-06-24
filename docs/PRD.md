# Product Requirements — Pediatric Care Platform

**One line:** A privacy-first **desktop** app that pairs an AI pediatric symptom checker + triage with everyday clinical workflows (doctors, appointments, records, growth stages) — built by merging Medical-Research (the brain) and Pediatrics (the body).

> Synthetic data only. **NOT a medical device, NOT for diagnosis.** Decision support, never a verdict.

---

## Why this exists

| Problem | Today's pain | What we change |
|---------|--------------|----------------|
| Parents panic over symptoms | Web searches over-scare or under-warn; no age-aware reasoning | Transparent, weighted symptom→disease matching with explicit triage + disclaimers |
| Clinical context is scattered | Symptom tools, records, and scheduling live in separate apps | One app: check → triage → book → record, with growth milestones alongside |
| AI in health is opaque | Black-box scores erode trust | Every prediction shows **matched symptoms** + plain-language explanation; model-agnostic interface |
| Mobile/cloud-first tools leak PHI | Data sprawl, weak consent | Desktop-first, local-by-default, compliance hooks gated before any real PHI |

---

## Target users & personas

| Persona | Role | Goal | Key journey |
|---------|------|------|-------------|
| **Priya — Parent/Guardian** | `guardian` | "Should I worry, wait, or go now?" | Symptom check → triage → book appointment |
| **Dr. Rao — Pediatrician** | `doctor` | Fast context before/during a visit | Review records → growth stage → decision support |
| **Sam — Clinic Admin** | `admin` | Keep the schedule and roster sane | Manage doctors → bookings → records |
| **Lee — Researcher** *(later)* | `researcher` | Study synthetic patterns safely | Query graph + de-identified datasets |

Roles are defined in the API contract (`app/schemas.py`); enforcement (auth/RBAC) is **planned**.

---

## Goals & non-goals

| Goals (v1.0) | Non-goals |
|--------------|-----------|
| Trustworthy, explainable triage for common pediatric symptoms | Real diagnosis or treatment decisions |
| Unified desktop workflow: check → triage → book → record → track growth | Mobile app (explicitly dropped — was Flutter in Pediatrics) |
| Privacy-first: local-by-default, compliance hooks before real PHI | Cloud-multi-tenant SaaS at launch |
| Model-agnostic AI (swap rule-based → GNN without API changes) | Being a certified/regulated medical device |
| Persistent, auditable data layer | Insurance/billing as a core feature (later) |

---

## User journeys

**J1 — Symptom check → triage → book (primary)**
1. Guardian enters symptoms (+ optional age in months).
2. `POST /predict` → ranked diseases, confidence, matched symptoms, **triage** (`self-care` \| `see-doctor` \| `urgent`), explanation, disclaimer.
3. On `see-doctor`/`urgent`, guardian books via `POST /appointments` (conflicts → `409`).
4. *(planned)* Result saved to the child's medical record.

**J2 — Clinician review**
1. `GET /records/{subject}` for history → `GET /stages/{age_months}` for expected milestones + red flags → optional decision support.

**J3 — Growth tracking**
1. `GET /stages/{age_months}` → stage, expected milestones (motor/language/social/cognitive), red flags. *(Per-child tracking & percentile charts: planned.)*

---

## Success metrics

| Dimension | Metric | v1.0 target | Status |
|-----------|--------|-------------|--------|
| Trust | % predictions shown with matched symptoms + explanation | 100% | done |
| Safety | Red-flag symptoms always escalate to `urgent` | 100% | done (tested) |
| Quality | Symptom-checker eval accuracy on synthetic set | Track via `make eval` | baseline exists |
| Workflow | Check→book completion in one session | measurable | needs persistence + auth |
| Reliability | API test pass rate | 100% green | done |
| Latency | `/predict` p95 (rule-based) | < 300 ms local | informal |

---

## Scope by release

| Release | Theme | In scope | Status |
|---------|-------|----------|--------|
| **v0.1** | Merged MVP | All existing endpoints (`/health`, `/predict`, `/graph`, `/doctors`, `/appointments`, `/records`, `/stages`), web pages, Tauri shell, in-memory store | **done** |
| **v1.0** | Production | Auth/RBAC, persistence (Postgres), real ML model, FHIR records, notifications, signed installers, compliance controls live | planned |
| **Later** | Care platform | Telehealth, messaging, payments, multi-language, researcher tooling | planned |

See `docs/roadmap.md` for phasing and `docs/feature-backlog.md` for the granular inventory.

---

## Assumptions

- Single-clinic / single-household desktop deployment first; no multi-tenant cloud at v1.0.
- Synthetic dataset (`data/symptom_disease.csv`, 10 diseases) is sufficient to validate UX and the AI interface before real data.
- LLM is for **explanations only** and must degrade gracefully when absent (offline-capable).
- FHIR-style field naming now lowers future interoperability cost.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users treat triage as diagnosis | Safety / liability | Persistent disclaimers; red-flag escalation; never name a single "answer" |
| Rule-based predictor mistaken for trained ML | Trust / accuracy claims | Eval harness + clear "decision support" framing; model-agnostic swap path |
| Adding real PHI before controls land | HIPAA/GDPR breach | Synthetic-only gate; compliance hooks (`app/security.py`) must be live first |
| Scope creep from two merged backlogs | Slipped v1.0 | Core/Growing/Heavy tagging in backlog; ruthless non-goals |
| LLM provider cost/availability | Degraded UX | Default to local `ollama`; graceful no-LLM fallback |
