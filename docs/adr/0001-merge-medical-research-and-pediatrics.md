# ADR 0001 — Merge Medical-Research and Pediatrics into one product

**Status:** Accepted

## Context

Two prior projects existed separately and neither was a complete product:

- **Medical-Research** — the *brain*: AI symptom checker, symptom→disease
  knowledge graph, synthetic data pipeline, and a HIPAA/GDPR compliance
  framework — but **no application** to deliver it. It also carried committed
  secrets in its git history.
- **Pediatrics** — the *body*: working clinical workflows (doctors,
  appointments, records, growth stages) as a **Flutter mobile app on Firebase** —
  but **no intelligence layer**.

Maintaining both meant two stacks, two data layers, and a capability gap on each
side. The intelligence had no home; the app had no intelligence.

## Decision

Merge the two into a single product, the **Pediatric Care Platform**: one
FastAPI + Python backend exposing both intelligence (`routers/intelligence.py`)
and clinical (`routers/clinical.py`) endpoints under one typed contract
(`app/schemas.py`), with one Next.js/Tauri frontend.

Reuse Medical-Research's *data and concepts* (knowledge graph, synthetic data,
compliance design); **rebuild** the runtime (predictor, services, store, UI) to
live in the unified stack. Create the repo with a **fresh git history** so the
predecessor's leaked secrets do not carry forward.

## Consequences

**Positive**
- One product delivers what neither parent could: an intelligent, compliant
  clinical app.
- Single backend, single typed API, single UI — one place to test and ship.
- Fresh git history removes the inherited secret-leak liability.

**Negative / costs**
- Rebuild cost: clinical workflows and UI were reimplemented, not ported.
- Compliance framework carried over as **stubs** (`app/security.py`), not
  implemented — debt to retire before real PHI.
- History rewrite means the old commit provenance is gone (intentional).

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep both projects separate | Permanent capability gap; double maintenance |
| Bolt intelligence onto the Flutter/Firebase app | Locks into mobile + Firebase; see [ADR 0002](0002-desktop-with-tauri-not-flutter.md) |
| Add clinical workflows to Medical-Research as-is | It was specs/vault, not an app — same rebuild either way |
| Fork the old repo (keep history) | Carries forward committed secrets — unacceptable |

See also [docs/merge-rationale.md](../merge-rationale.md) for the full
capability matrix.
