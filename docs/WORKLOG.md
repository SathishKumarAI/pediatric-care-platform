# Worklog

> Append-only. Newest entry on top. Never delete or rewrite past entries.

## 2026-06-24 15:24 — PCP-6: Loading / empty / error states

**Summary:** Added shared, accessible state components and applied them across
fetching pages, so the UI no longer silently swallows errors or shows bare text.

**Changes:**
- `web/app/_components/States.tsx` — `Loading` (role=status), `EmptyState`, `ErrorBanner` (role=alert + Retry).
- Doctors page now shows loading + error(retry) + empty. Records/appointments/patients use `EmptyState`; patients surfaces errors via `ErrorBanner`.
- `web/app/__tests__/states.test.tsx` — 3 tests (7 web tests total).

**Decisions:**
- One shared components file so states evolve in one place (skeletons, retry, a11y) per the ui-ux-spec component backlog.

**Verification:** Vitest 7/7; `next build` clean (10 routes).

**Follow-ups:**
- [ ] PCP-7 — form validation + inline field errors.

## 2026-06-24 15:18 — PCP-5: Save symptom result to record

**Summary:** The symptom checker can now persist a result into the active
child's medical record, connecting the AI layer to the clinical record.

**Changes:**
- `web/app/symptom-checker/page.tsx` — "Save to {child}'s record" button (shown only when a child is active); writes a `MedicalRecord` summarizing triage + top predictions + symptoms.
- `specs/symptom-checker.md` — acceptance criteria for the save action.

**Verification:** Vitest 4/4; `next build` clean (10 routes).

**Follow-ups:**
- [ ] PCP-6 — consistent loading/empty/error states across pages.

## 2026-06-24 15:12 — PCP-4: Patient/child profiles + active-child context

**Summary:** Added child profiles end-to-end and a selected-child context that
replaces the hardcoded `p1` and the manual age/subject entry across the app.

**Changes:**
- `specs/patients.md` — feature spec (spec-first).
- Backend: `Patient`/`PatientCreate`/`Sex` schemas with computed `age_months`; `patients` table; store methods (both impls); `POST`/`GET /patients`, `GET /patients/{id}`. 3 new tests (15 total).
- Frontend: `web/lib/patient-context.tsx` (localStorage-persisted active child), `/patients` page, sidebar active-child badge, dashboard card.
- Wiring: appointments book/list use the active child; records subject defaults to it; symptom-checker age prefills from `age_months`.
- Lint: converted `Role`/`Sex`/`AppointmentStatus` to `StrEnum` and `datetime.UTC` — project-wide `ruff` now clean (was failing on pre-existing UP042/UP017).

**Decisions:**
- Active-child state is client-only (localStorage); API stays stateless. Ownership/auth deferred to PCP-8.
- `age_months` computed server-side from `birth_date` so it's always current.

**Verification:** `pytest` 15/15; `ruff` clean; Vitest 4/4; `next build` clean (10 routes incl. `/patients`).

**Follow-ups:**
- [ ] PCP-5 — save a symptom-check result into the active child's record.
- [ ] Add a Vitest test for the patients page / context.

## 2026-06-24 15:02 — PCP-3: Frontend test setup

**Summary:** Stood up the frontend test stack — Vitest + Testing Library for
unit/component, Playwright for e2e — and wired Vitest into CI.

**Changes:**
- `web/vitest.config.ts`, `web/vitest.setup.ts` — Vitest + jsdom + `@` alias.
- `web/lib/__tests__/api.test.ts` — api client: payload building, 409 error detail, records URL.
- `web/app/__tests__/doctors.test.tsx` — Doctors page renders mocked API data.
- `web/playwright.config.ts`, `web/e2e/smoke.spec.ts` — e2e smoke (dashboard nav, stages).
- `.github/workflows/ci.yml` — web job now runs `npm run test`.
- `web/.gitignore`, `docs/test-strategy.md` — test artifacts ignored; strategy marks Vitest/Playwright wired.

**Decisions:**
- Vitest (not Jest) — first-class Vite/Tailwind4 + ESM fit, fast.
- Playwright e2e kept out of CI for now (needs browser install + a running backend); runs locally via `npm run test:e2e`.

**Verification:** `npm run test` 4/4 pass; `next build` clean (9 routes, test files not emitted as routes).

**Follow-ups:**
- [ ] PCP-4 — patient/child profile model + context.
- [ ] Grow component tests per page; add symptom-check happy-path e2e.

## 2026-06-24 14:55 — PCP-1: Persistent SQLite store

**Summary:** Replaced the in-memory-only store with a persistent SQLite layer
behind the same repository interface, so records and appointments survive a
restart. Routers unchanged.

**Changes:**
- `app/services/db.py` — new: sqlite3 connection + schema (doctors/appointments/records), JSON-encoded lists, indexes.
- `app/services/store.py` — split into `InMemoryStore` + `SqliteStore`; `get_store()` picks by `DATABASE_URL` (sqlite → persistent, default).
- `tests/conftest.py` — new: throwaway per-session SQLite DB so tests start clean and never touch dev data.
- `tests/test_api.py` — added persistence-across-restart test. 12 tests pass; eval still 100%.

**Decisions:**
- Kept both store implementations behind one interface (Repository Pattern) instead of forcing infra — in-memory still available for `DATABASE_URL` non-sqlite. Postgres is a later swap (same SQL shape; see data-model.md).
- SQLite appointment IDs use a short uuid (not the in-memory counter) to avoid collisions across restarts.

**Verification:** `pytest` 12/12; `ruff` clean; `eval/run_eval.py` 100% top-1/top-3.

**Follow-ups:**
- [ ] PCP-3 — frontend test setup (Vitest + Playwright).
- [ ] PCP-4 — patient/child profile model (now unblocked by persistence).

## 2026-06-24 14:48 — PCP-2: Medical Records UI

**Summary:** Started building from the docs. Set up the live ticket board
(`docs/TICKETS.md`) and shipped the first feature ticket: the Medical Records UI.

**Changes:**
- `web/app/records/page.tsx` — new page: load a patient's records by ID, add append-only notes + attachment refs.
- `web/lib/api.ts` — added `MedicalRecord` type + `records()`/`addRecord()` client methods.
- `web/app/layout.tsx`, `web/app/page.tsx` — added Records to nav + dashboard.
- `tests/test_api.py` — 2 records tests (add/list by subject, empty for unknown). 11 tests pass.
- `docs/TICKETS.md` — created board; PCP-2 → done, current focus now PCP-1.
- `CHANGELOG.md` — Unreleased section.

**Decisions:**
- Records UI uses existing `/records` API as-is (client supplies id + recorded timestamp), matching the current backend contract. Persistence (PCP-1) comes next so records survive restart.

**Verification:** `pytest` 11/11 pass; `next build` clean, 9 static pages incl. `/records`.

**Follow-ups:**
- [ ] PCP-1 — persistent SQLite store (records currently reset on restart).

## 2026-06-24 14:42 — Merged app scaffold + full production doc set

**Summary:** Created the Pediatric Care Platform by merging Medical-Research
(AI/knowledge-graph) with Pediatrics (clinical workflows) into one desktop app,
then wrote the full production-readiness documentation set. Public repo live.

**Changes:**
- Backend (`app/`) — FastAPI service: symptom checker (`/predict`), knowledge graph (`/graph`), doctors/appointments/records/stages. 9/9 pytest pass, eval 100% top-1/top-3.
- Frontend (`web/`) — Next.js 15 + React 19 + Tailwind 4, 5 pages, Tauri v2 desktop shell. Builds clean.
- Data (`scripts/generate_data.py`, `data/symptom_disease.csv`) — synthetic 10-disease dataset.
- Docs — ~23 docs: PRD, roadmap, feature-backlog, ui-ux-spec, architecture, data-model, api-reference, 4 ADRs, test-strategy, definition-of-done, SECURITY, threat-model, privacy-compliance, incident-response, deployment, runbook, release-process, monitoring, disaster-recovery, accessibility, doc catalog.
- Specs (`specs/`) — 6 feature specs.

**Decisions:**
- Desktop via Tauri v2 (not the old Flutter mobile app); web/desktop only. See ADR-0002.
- Env-switchable LLM (Ollama default / Claude). ADR-0003.
- In-memory knowledge-graph + store by default; Neo4j/Postgres optional later. ADR-0004.
- Fresh git history so predecessor Medical-Research secrets did not carry over.

**Follow-ups:**
- [ ] See `docs/TICKETS.md` for the live build backlog and current focus.
