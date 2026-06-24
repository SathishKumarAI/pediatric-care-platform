# Test Strategy

How we keep an AI-assisted clinical app honest. The point: **tests are the
contract between the predictor's transparency claims, the API, and the typed
frontend.** If a test can't fail, the claim isn't real.

This is synthetic-data software, **not a medical device** — but the *engineering*
discipline (triage red flags, appointment conflicts, future PHI paths) is treated
as if lives depended on it, because in production they would.

## Testing pyramid for this stack

| Layer | Scope | Tool | Why it lives here |
|-------|-------|------|-------------------|
| Unit | `app/services/*` in isolation (predictor scoring, triage rules, stage lookup, store CRUD, conflict math) | pytest | Fastest signal; business logic must be provable without HTTP or a DB |
| API integration | Router behaviour over real request/response, status codes, validation | pytest + `TestClient` | Proves `app/routers/*` + `app/schemas.py` wire together; catches 409/422/404 contract drift |
| Predictor eval | Model quality (top-1 / top-3 accuracy) against labelled cases | `eval/run_eval.py` over `eval/cases.yaml` | A unit test says "code runs"; eval says "predictions are *right*" — a separate, regressible quality gate |
| Contract | `app/schemas.py` ↔ `web/lib/api.ts` stay in sync | manual now → codegen (planned) | A typed frontend that lies about the API is worse than an untyped one |
| Component | React pages/components render + handle states | Vitest + Testing Library (**wired**, `npm run test` — api client + Doctors page) | Grows per page (PCP-3) |
| E2E | Full flow: symptom entry → predict → triage banner | Playwright (**wired**, `npm run test:e2e` — needs `npx playwright install` + backend) | `web/e2e/smoke.spec.ts` covers dashboard nav + stages |

Heavier layers are thinner — most logic should be provable at the unit/eval
level, where it's cheap and deterministic.

## Current coverage vs target

| Area | Now | Target | Tag | Notes |
|------|-----|--------|-----|-------|
| API integration (`tests/test_api.py`) | 9 tests pass via `TestClient` | All endpoints incl. error paths | Core | Happy-path covered; error paths are the gap (below) |
| Predictor eval (`eval/`) | top-1 / top-3 = 100% on `cases.yaml` | ≥ 95% top-3, ≥ 80% top-1, no regression per PR | Core | 100% is on a tiny synthetic set — guard against *regression*, don't trust the absolute |
| Service unit tests | Implicit via API tests | Direct unit tests for predictor, triage, conflict, stages | Growing | Logic deserves tests that don't route through HTTP |
| Triage red-flag escalation | Covered indirectly | Explicit test per red-flag symptom | **Core (must)** | Safety-critical — see below |
| Appointment conflict (409) | Asserted in API tests | Dedicated overlap/edge matrix | Core | Boundary cases (touching, contained, identical) |
| Validation (422) | Partial | Every required-field / bad-type case | Growing | Pydantic gives this cheaply |
| Frontend components | api client + Doctors page (Vitest) | Every page renders + error/loading states | Growing | Wired (PCP-3); grow per page |
| E2E flows | Dashboard nav + stages smoke (Playwright) | Symptom-check + appointment book happy paths | Heavy | Wired (PCP-3); needs browsers + backend |
| Contract (schemas↔client) | Manual review | Automated drift check / codegen | Heavy | Highest leverage once automated |
| PHI / auth paths | N/A (stubs only) | Full coverage before any real PHI | **Heavy (must, gated)** | Blocks production with real data |

### Known integration gaps (write these next)
- `POST /appointments` conflict matrix — overlapping, adjacent, identical slots.
- `POST /predict` with **empty `symptoms`** and unknown symptoms (no-data path).
- `GET /graph/{node}` for a missing node → 404.
- `GET/POST /records/{subject}` for an unknown `subject`.
- `422` shape assertions on every endpoint with a request body.

## What MUST be tested before production

These are non-negotiable gates. Each maps to a real failure mode.

| Must-pass gate | Failure if untested | Required tests |
|----------------|---------------------|----------------|
| **Triage red flags** | App says "self-care" on `difficulty_breathing` / `chest_pain` / `seizure` / `unresponsive` / `blue_lips` / `stiff_neck` / `severe_dehydration` | One test per red-flag symptom asserting triage == `urgent`, alone and mixed with benign symptoms |
| **Appointment conflict (409)** | Double-booking a doctor | Conflict matrix incl. boundary slots; assert 409 + no write on conflict |
| **PHI access paths** (when DB lands) | Unauthorized record read; no audit trail | AuthZ on `records/{subject}`, audit-log assertion, GDPR-erasure path |
| **Auth** (planned) | Open clinical API | Authn required on protected routes; rejects missing/invalid token |
| **Schema↔client contract** | Frontend silently mishandles a renamed field | Drift check fails CI when `schemas.py` and `api.ts` diverge |
| **Eval non-regression** | A "harmless" change quietly degrades predictions | `eval/run_eval.py` gates the PR; accuracy must not drop |

## Coverage targets

| Component | Target | Rationale |
|-----------|--------|-----------|
| `app/services/*` (logic) | ~90% line, 100% on triage red-flag + conflict branches | Branch coverage on safety logic matters more than line % |
| `app/routers/*` | Every endpoint × (success, validation error, not-found/conflict) | Contract surface must be exercised |
| `app/security.py` | 100% once implemented (currently stubs) | PHI gate |
| Frontend | Key pages + error/loading states (planned) | Don't chase % before tests exist |

Coverage is a **floor, not a goal** — 100% line coverage with no red-flag
assertion is a failing test suite.

## Running

```bash
make test   # pytest (unit + API integration)
make eval   # predictor accuracy gate (eval/run_eval.py)
make lint   # ruff + mypy
```

CI (`.github/workflows/ci.yml`) runs backend ruff + pytest + eval and a `web`
`npm build` on every push. Attach `make test` / `make eval` output as evidence
in the PR (see [definition-of-done.md](definition-of-done.md)).
