# Tickets — live build backlog

> The "where am I" board. Update status as work moves. Derived from
> [`roadmap.md`](roadmap.md) + [`feature-backlog.md`](feature-backlog.md).
> Status: `todo` · `in-progress` · `blocked` · `done`. Newest tickets appended; statuses edited in place.

**Current focus:** PCP-5 — Symptom checker: save result to record

**Milestone:** v0.2 Foundations (persistence, records UI, patient context, frontend tests)

---

## In progress
| ID | Title | Status | Spec | Notes |
|----|-------|--------|------|-------|
| — | (none) | — | — | next: PCP-5 |

## To do — v0.2 Foundations
| ID | Title | Status | Priority | Depends on |
|----|-------|--------|----------|------------|
| PCP-5 | Symptom checker: save result to record | todo | Growing | PCP-2, PCP-4 |
| PCP-6 | Loading / empty / error states across pages | todo | Core | — |
| PCP-7 | Form validation + inline errors | todo | Core | — |

## To do — v0.5 Clinical depth
| ID | Title | Status | Priority | Depends on |
|----|-------|--------|----------|------------|
| PCP-8 | Auth & accounts (signup/login/roles) | todo | Core | PCP-1 |
| PCP-9 | Appointment cancel / reschedule | todo | Growing | PCP-1 |
| PCP-10 | Doctor availability / working-hours enforcement | todo | Growing | PCP-1 |
| PCP-11 | Growth percentile charts | todo | Growing | PCP-4 |
| PCP-12 | Neo4j-backed knowledge graph | todo | Growing | — |
| PCP-13 | Real ML model swap-in (replace overlap scorer) | todo | Heavy | eval harness |

## To do — v1.0 Production (Heavy gates)
| ID | Title | Status | Priority | Depends on |
|----|-------|--------|----------|------------|
| PCP-14 | Compliance controls: consent, audit, RBAC, encryption | todo | Heavy | PCP-1, PCP-8 |
| PCP-15 | Observability: metrics, tracing, Sentry | todo | Heavy | — |
| PCP-16 | Desktop installer signing + auto-update | todo | Heavy | — |
| PCP-17 | WCAG 2.1 AA accessibility pass | todo | Growing | PCP-6 |

## Done
| ID | Title | Status | Shipped |
|----|-------|--------|---------|
| PCP-0 | Merged scaffold + backend + web + full docs | done | 2026-06-24 (v0.1.0) |
| PCP-2 | Medical Records UI page | done | 2026-06-24 — `/records` page + API client methods + 2 backend tests |
| PCP-1 | Persistent store (SQLite via DATABASE_URL) | done | 2026-06-24 — InMemory/Sqlite stores behind one interface; records+appointments persist; test DB isolated; 12 tests |
| PCP-3 | Frontend test setup (Vitest + Playwright) | done | 2026-06-24 — Vitest (4 tests: api client + Doctors page) in CI; Playwright e2e smoke; gitignore + test-strategy updated |
| PCP-4 | Patient/child profile model + context | done | 2026-06-24 — Patient CRUD + persistence + computed age_months; `/patients` page; selected-child context (localStorage) drives appointments/records/symptom-checker; spec; 15 backend tests |
