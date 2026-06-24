# Definition of Done

The point: **"works on my machine" is not done.** A change is done when the next
engineer (or the next you) can trust it without re-deriving why it's safe.

Tiered so small changes aren't blocked by production gates, but **anything
touching triage, conflict logic, or PHI jumps straight to Heavy.**

## Tiers — when each applies

| Tier | Use for | Examples |
|------|---------|----------|
| **Core** | Every change, always | typo fixes, copy, refactors, new util |
| **Growing** | New behaviour / endpoints / pages | new router, new service method, new UI page |
| **Heavy** | Safety- or compliance-critical, or production-bound | triage rules, red-flag list, appointment conflict, PHI/auth, store→DB migration |

## Core (every PR)

- [ ] **Lint clean** — `make lint` (ruff) passes, no new warnings.
- [ ] **Types clean** — `mypy` passes; no new `# type: ignore` without a reason.
- [ ] **Tests pass** — `make test` green locally and in CI.
- [ ] **Eval not regressed** — `make eval` top-1/top-3 not below baseline (if logic
      or data touched).
- [ ] **No secrets / no real PHI** — synthetic data only; nothing sensitive committed.
- [ ] **CHANGELOG updated** — user-visible change recorded.
- [ ] **Self-review done** — diff read; no debug prints, dead code, or TODOs left silent.

## Growing (new behaviour) — Core, plus:

- [ ] **Spec written first** — `/specs/[feature].md` exists, states behaviour as
      *WHEN X THEN Y* and how to verify done (per `CLAUDE.md`).
- [ ] **Tests include edge cases** — explicitly the **no-data / empty / unknown**
      paths (empty symptoms, unknown node, missing subject), not just happy path.
- [ ] **Schemas ↔ client synced** — `app/schemas.py` changes mirrored in
      `web/lib/api.ts`; verified, not assumed.
- [ ] **Status codes asserted** — new error paths (404/409/422) have tests.
- [ ] **Docs updated** — affected `docs/` page (api-reference, data-model, etc.)
      reflects the change.
- [ ] **Evidence attached** — paste `make test` (and `make eval` if relevant)
      output in the PR.

## Heavy (safety / compliance / production) — Growing, plus:

- [ ] **Triage red-flag tests** — if triage logic or the red-flag list changed,
      one test per affected red-flag symptom asserting `urgent`.
- [ ] **Conflict logic boundary tests** — if appointment logic changed, the
      overlap matrix (adjacent / contained / identical) is covered, 409 asserted.
- [ ] **Security review for PHI-touching code** — authZ, encryption at rest,
      audit log, retention, GDPR erasure considered against `app/security.py`
      stubs; reviewer signs off explicitly.
- [ ] **Auth enforced** — protected routes reject missing/invalid credentials
      (when auth lands).
- [ ] **Migration safety** — store→DB changes are reversible and don't lose data;
      rollback path documented.
- [ ] **Disclaimer intact** — `/predict` still returns the not-a-medical-device
      disclaimer; UI still surfaces it.

## The "show the why" rule

Every checked box should be defensible in one sentence. If you can't say *why*
a gate passed (e.g. "eval didn't regress because I re-ran it — output attached"),
it isn't checked, it's hoped.

## Evidence format (paste in PR)

```text
$ make test
... 9 passed ...

$ make eval
top-1: 1.00   top-3: 1.00   (baseline: 1.00 / 1.00)  OK
```

Without evidence, a PR is **In Review**, not **Done**.
