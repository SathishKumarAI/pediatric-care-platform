# Worklog

> Append-only. Newest entry on top. Never delete or rewrite past entries.

## 2026-06-24 16:08 — PCP-17: Accessibility pass

**Summary:** Closed the high-priority a11y gaps from `docs/accessibility.md`.

**Changes:**
- `web/app/globals.css` — global `:focus-visible` ring (WCAG 2.4.7).
- `web/app/symptom-checker/page.tsx` — chips `aria-pressed` + `role="group"`; age input label-associated; results `aria-live="polite"`; error `role="alert"`.
- `web/app/stages/page.tsx` — age input label-associated.
- `web/app/__tests__/symptom-a11y.test.tsx` — chip aria-pressed toggle test (11 web tests).
- `docs/accessibility.md` — marked done items; listed remaining (contrast, chip-group wording, numeric attrs, keyboard-trap audit).

**Verification:** Vitest 11/11; `next build` clean.

**Follow-ups:**
- [ ] PCP-15 observability; PCP-14 RBAC; remaining a11y items.

## 2026-06-24 16:00 — PCP-8: Auth & accounts

**Summary:** Added account signup/login with hashed passwords and token
sessions, plus the frontend auth flow. Identity now exists; route enforcement
(RBAC) is the next security ticket (PCP-14).

**Changes:**
- Backend: `app/services/auth.py` (PBKDF2 hashing, `AuthService` over `users`/`sessions` tables, token sessions), `app/routers/auth.py` (`/auth/signup|login|me|logout` + `get_current_user` dep), `users`/`sessions` schema, `UserCreate`/`LoginRequest`/`UserPublic`/`AuthToken` schemas, router wired in `main.py`.
- Frontend: `web/lib/auth-context.tsx`, `/login` page (login/signup toggle), token-aware `api` client (`Authorization` header, 204 handling), sidebar `AccountBadge`.
- Tests: 3 backend auth tests incl. "password never stored plaintext"; 1 web api test. 22 backend + 10 web tests; ruff clean.
- `specs/auth.md`.

**Decisions:**
- Stdlib-only auth (PBKDF2 + random tokens), no JWT/secret to leak; sessions in DB. Token expiry/refresh deferred.
- Did NOT gate clinical routes yet — that's RBAC (PCP-14) — so existing flows/tests stay green. `get_current_user` is ready to drop in.

**Verification:** backend 22/22; web 10/10; ruff clean; `next build` clean (11 routes incl. `/login`).

**Follow-ups:**
- [ ] PCP-17 a11y; PCP-14 RBAC enforcement using `get_current_user`; PCP-15 observability.

## 2026-06-24 15:48 — PCP-11: Growth milestone timeline chart

**Summary:** Added a milestone timeline chart to the stages page. Researched
true percentile charts and split that into a new backlog item (PCP-18).

**Changes:**
- `web/app/_components/MilestoneTimeline.tsx` — dependency-free SVG: milestones plotted by age, domain-colored, with a dashed current-age marker + legend.
- `web/app/stages/page.tsx` — renders the chart; age prefills from the active child.
- Backlog: added **PCP-18** (anthropometric measurement capture + WHO/CDC LMS percentile curves) to `docs/TICKETS.md` and `docs/feature-backlog.md`.

**Decisions / research:**
- True growth *percentile* charts need (a) per-child height/weight/head-circ measurements over time and (b) WHO (0–24mo) + CDC (2–20y) LMS reference tables — neither exists yet. Rather than fake it, PCP-11 ships the milestone timeline (real data we have) and PCP-18 captures the percentile work honestly.
- No chart library — hand-rolled SVG keeps the desktop bundle small (consistent with the lean stack).

**Verification:** Vitest 9/9; `next build` clean (10 routes).

**Follow-ups:**
- [ ] PCP-8 auth; PCP-18 percentile curves (researched, backlogged).

## 2026-06-24 15:40 — PCP-9 + PCP-10: cancel/reschedule + availability

**Summary:** Started v0.5. Added appointment cancel/reschedule and doctor
working-day availability enforcement, shared across both store backends.

**Changes:**
- `app/schemas.py` — `AppointmentUpdate` (status/start). `app/routers/clinical.py` — `PATCH /appointments/{id}` (404 unknown, 409 conflict/availability, 422 empty).
- `app/services/store.py` — `_guard()` (availability via `available_days` + slot conflict, excludes self on reschedule), `update_appointment()`, `get_doctor()` in both `InMemoryStore` and `SqliteStore`.
- `web/app/appointments/page.tsx` — Cancel + Reschedule buttons; cancelled rows struck through. `web/lib/api.ts` — `patchAppointment`.
- `tests/test_api.py` — cancel-frees-slot, reschedule+conflict, unavailable-day 409, 404/422; fixed the conflict test to use a working day. 19 backend tests.
- `specs/appointments.md` — cancel/reschedule/availability acceptance criteria.

**Decisions:**
- Availability granularity = day-of-week (`available_days`), matching the seed data; per-hour working hours deferred.
- Cancelled appointments free their slot (conflict check ignores non-booked).

**Verification:** backend 19/19; Vitest 9/9; ruff clean; eval 100%; `next build` clean.

**Follow-ups:**
- [ ] PCP-11 growth charts; PCP-8 auth.

## 2026-06-24 15:30 — PCP-7 + v0.2.0 release

**Summary:** Added form validation with inline errors, completing the v0.2
Foundations milestone (PCP-1…7). Cut the v0.2.0 release.

**Changes:**
- `web/app/patients/page.tsx` — inline field errors (name required; birth date required + not in the future; `max` on the date input; `aria-invalid`).
- `web/app/appointments/page.tsx` — inline past-time guard on the datetime field; book disabled when in the past.
- `web/app/__tests__/patients-validation.test.tsx` — 2 tests (9 web tests total).
- Version bumped to 0.2.0 in `pyproject.toml`, `app/__init__.py`, `web/package.json`, `web/src-tauri/{tauri.conf.json,Cargo.toml}`.
- `CHANGELOG.md` — rolled Unreleased into `[0.2.0]`; deduped; refreshed Planned.

**Decisions:**
- Validation kept inline + lightweight (no form library yet); revisit react-hook-form/zod if forms grow.

**Verification:** Vitest 9/9; backend 15/15; eval 100%; `next build` clean (10 routes). Tag: v0.2.0.

**Follow-ups:**
- [ ] v0.5 starts at PCP-8 (auth & accounts).

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
