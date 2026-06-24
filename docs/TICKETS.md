# Tickets — live build backlog

> The "where am I" board. Update status as work moves. Derived from
> [`roadmap.md`](roadmap.md) + [`feature-backlog.md`](feature-backlog.md).
> Status: `todo` · `in-progress` · `blocked` · `done`. Newest tickets appended; statuses edited in place.

**Current focus:** PCP-12 — Neo4j-backed knowledge graph (infra-bound; see wrap-up)

**Milestone:** ✅ v0.2 Foundations COMPLETE (PCP-1…7) — tagged v0.2.0. Next: v0.5 Clinical depth.

---

## In progress
| ID | Title | Status | Spec | Notes |
|----|-------|--------|------|-------|
| — | (none) | — | — | next: PCP-8 |

## To do — v0.2 Foundations
✅ All done (PCP-1 … PCP-7) — see Done table.

## To do — v0.5 Clinical depth
| ID | Title | Status | Priority | Depends on |
|----|-------|--------|----------|------------|
| PCP-12 | Neo4j-backed knowledge graph | todo | Growing | — |
| PCP-13 | Real ML model swap-in (replace overlap scorer) | todo | Heavy | eval harness |
| PCP-18 | Anthropometric measurements + WHO/CDC percentile curves | todo | Growing | PCP-4 |

## To do — v1.0 Production (Heavy gates)
| ID | Title | Status | Priority | Depends on |
|----|-------|--------|----------|------------|
| PCP-14 | Compliance controls: consent, audit, encryption (RBAC shipped in PCP-14a) | todo | Heavy | PCP-1, PCP-8 |
| PCP-15 | Observability: tracing, Sentry, dashboards (metrics shipped in PCP-15a) | todo | Heavy | — |
| PCP-16 | Installer code-signing + notarization + auto-update (CI build shipped in PCP-16a) | todo | Heavy | signing certs |

## Done
| ID | Title | Status | Shipped |
|----|-------|--------|---------|
| PCP-0 | Merged scaffold + backend + web + full docs | done | 2026-06-24 (v0.1.0) |
| PCP-2 | Medical Records UI page | done | 2026-06-24 — `/records` page + API client methods + 2 backend tests |
| PCP-1 | Persistent store (SQLite via DATABASE_URL) | done | 2026-06-24 — InMemory/Sqlite stores behind one interface; records+appointments persist; test DB isolated; 12 tests |
| PCP-3 | Frontend test setup (Vitest + Playwright) | done | 2026-06-24 — Vitest (4 tests: api client + Doctors page) in CI; Playwright e2e smoke; gitignore + test-strategy updated |
| PCP-4 | Patient/child profile model + context | done | 2026-06-24 — Patient CRUD + persistence + computed age_months; `/patients` page; selected-child context (localStorage) drives appointments/records/symptom-checker; spec; 15 backend tests |
| PCP-5 | Symptom checker: save result to record | done | 2026-06-24 — "Save to record" writes a triage+predictions summary to the active child's record |
| PCP-6 | Loading / empty / error states across pages | done | 2026-06-24 — shared Loading/EmptyState/ErrorBanner (a11y roles + retry) applied to doctors/records/appointments/patients; 3 tests |
| PCP-7 | Form validation + inline errors | done | 2026-06-24 — inline field errors on patients form (name + no future DOB) and appointment past-time guard; 2 tests (9 web total) |
| PCP-9 | Appointment cancel / reschedule | done | 2026-06-24 — `PATCH /appointments/{id}`; cancel frees slot, reschedule re-checks conflict; UI cancel/reschedule buttons; tests |
| PCP-10 | Doctor availability enforcement | done | 2026-06-24 — booking/reschedule on a non-working day rejected 409; enforced in both stores; tests |
| PCP-11 | Growth milestone timeline chart | done | 2026-06-24 — SVG timeline of milestones by age + current-age marker on stages page (no chart lib); age prefills from active child. True percentile curves split out to PCP-18 |
| PCP-8 | Auth & accounts (signup/login/roles) | done | 2026-06-24 — PBKDF2 password hashing + token sessions (`/auth/signup,login,me,logout`); `get_current_user` dep (RBAC-ready); `/login` page + auth context + token-aware client + sidebar account badge; spec; 22 backend + 10 web tests |
| PCP-17 | WCAG 2.1 AA accessibility pass | done | 2026-06-24 — `:focus-visible` ring, chip `aria-pressed` + group, label associations, `aria-live` results, `role=alert` errors; a11y test; doc updated (remaining gaps noted) |
| PCP-15a | Observability: request metrics + timing | done | 2026-06-24 — timing middleware (`X-Response-Time-ms`), in-process per-route counters, `GET /metrics` (Prometheus text). Tracing/Sentry/dashboards remain in PCP-15 |
| PCP-14a | RBAC enforcement (role-gated writes) | done | 2026-06-24 — flag-gated `REQUIRE_AUTH`; `require_roles()` dep on patient/appointment/record writes (records limited to doctor/admin/guardian); 401/403; toggle test. Consent/audit/encryption remain in PCP-14 |
| PCP-16a | Release CI to build desktop installers | done | 2026-06-24 — `.github/workflows/release.yml` (tauri-action, 3-OS matrix, draft release on `v*` tag). Code-signing/notarization/auto-update need certs → remain in PCP-16 |
