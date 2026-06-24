# Worklog

> Append-only. Newest entry on top. Never delete or rewrite past entries.

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
