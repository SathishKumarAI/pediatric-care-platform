# CLAUDE.md

## Project overview
Pediatric Care Platform — a desktop app merging pediatric clinical workflows
(doctors, appointments, records, growth stages) with AI decision support
(symptom checker over a symptom→disease knowledge graph). Built by merging two
prior projects: Medical-Research (the brain) + Pediatrics (the body).

## Tech stack
- Backend: FastAPI + Python 3.12, Pydantic 2 (`app/`)
- Frontend: Next.js 15 + React 19 + Tailwind 4 + TypeScript (`web/`)
- Desktop shell: Tauri v2 (`web/src-tauri/`)
- Knowledge graph: Neo4j optional; in-memory CSV fallback when `NEO4J_URI` unset
- Store: in-memory repository (SQLite/Postgres via `DATABASE_URL` later)
- LLM: env-switchable `PROVIDER` — `ollama` (default, free, `llama3.1:8b`) | `claude` (`claude-opus-4-8`, needs `ANTHROPIC_API_KEY`); explanations only, degrades gracefully
- Tests: pytest — run with `make test` (also `make eval`)

## Key concepts (see GLOSSARY.md for the full list)
- Triage — self-care | see-doctor | urgent; escalates to urgent on red-flag symptoms
- Knowledge graph — symptom↔disease relations (HAS_SYMPTOM / INDICATES)
- Decision support — ranked possibilities, NOT a diagnosis

## Existing features
See FEATURES.md and /specs/ before building anything new — don't duplicate or break it.

## Conventions
- Match the style of nearby code; follow existing router/service/schema patterns.
- Do NOT add dependencies without asking.
- Python: 4-space indent, ruff-clean, type hints; line length 100.
- TS/React: 2-space indent, function components, typed `api` client in `web/lib/api.ts`.
- API contract lives in `app/schemas.py` — keep `web/lib/api.ts` in sync.
- New logic requires unit tests, including no-data and edge cases.

## How features are briefed
Write/refresh a spec in `/specs/[feature].md` first. Explore + propose a plan
before writing code; state behaviour as "WHEN X THEN Y"; define how to verify done.

## Safety (non-negotiable)
Synthetic data only. NOT a medical device, NOT for real diagnosis. Before real
PHI: consent, encryption, audit log, retention, RBAC, GDPR erasure (stubs in `app/security.py`).
Never commit real PHI or secrets. Repo has a FRESH git history — the predecessor
Medical-Research repo had secrets in its history; none carried over.

## Commands
- Backend: `make dev`   Web: `make web`   Desktop: `make desktop`
- Test: `make test`   Eval: `make eval`   Lint: `make lint`   Data: `make data`
