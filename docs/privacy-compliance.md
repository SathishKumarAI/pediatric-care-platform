# Privacy & Compliance (HIPAA / GDPR / COPPA)

> 🚨 **WE ARE NOT COMPLIANT YET.** This system runs on **synthetic data only**, has **no auth, no encryption, and an in-memory store**, and the compliance hooks in `app/security.py` are **stubs** (an audit-log placeholder + a TODO). Everything below is a **prerequisite before any real patient data is accepted** — not a description of shipped controls. The predecessor *Medical-Research* repo documented a HIPAA/GDPR framework that **was never implemented**; this document continues that mapping but is explicit about the gap.

## Why the bar is unusually high here

This platform handles **pediatric (children's) health data**. That stacks three regimes:

| Regime | Applies because | Key extra demand |
|--------|-----------------|------------------|
| **HIPAA** (US) | Identifiable health info created/handled by a covered entity or business associate | Safeguards, audit, breach notice (60 days), BAAs with processors |
| **GDPR** (EU) | Health = *special-category* personal data (Art. 9) | Explicit lawful basis, DPIA, 72-hour breach notice, erasure/portability |
| **COPPA** (US, **<13**) | Online service collecting personal info from children under 13 | **Verifiable parental consent**, strict data minimization, parental access/deletion |

Children **cannot consent for themselves**, so a **verified-parent/guardian consent** model is mandatory — this is the single most load-bearing control and is **not built yet**.

## Required controls → regulation → status → where it lives

| Control | HIPAA | GDPR | COPPA | Status | Where it must live in code |
|---------|:-----:|:----:|:-----:|--------|----------------------------|
| **Consent capture** (record + version + timestamp) | ✓ | ✓ (Art. 6/9) | ✓ | **planned — stub** | new consent service + check at write/read; gate in `app/security.py` |
| **Verifiable parental consent** for minors (<13) | — | ✓ (Art. 8) | ✓ **(core)** | **planned — not started** | consent service keyed to guardian identity; enforce before any child-data op |
| **Data minimization** (collect/keep only what's needed; don't send PHI to LLM) | ✓ | ✓ | ✓ | **partial** | schema review (`app/schemas.py`); prompt builder in `providers.py` must exclude PHI |
| **Encryption in transit (TLS)** | ✓ | ✓ | ✓ | **planned** | reverse-proxy/TLS for server mode; loopback-only for desktop |
| **Encryption at rest** | ✓ | ✓ | ✓ | **planned** | DB/field encryption in `services/store.py`; keys via OS keychain, not `.env` |
| **Audit logging** (who/what/when, append-only) | ✓ **(core)** | ✓ (accountability) | ✓ | **partial — stub** | `record_access()` in `app/security.py`; needs real identity + immutable store |
| **Access control / RBAC** | ✓ | ✓ | ✓ | **planned — TODO** | FastAPI dependency on each route; roles: clinician/admin/parent; `app/security.py` |
| **Breach notification** | ✓ (60 days) | ✓ (72 hours) | ✓ | **planned** (process) | see `docs/incident-response.md` |
| **Data retention / disposal** | ✓ | ✓ (storage limitation) | ✓ (delete when no longer needed) | **planned — TODO** | retention policy + purge job in `services/store.py` |
| **Right to erasure** (delete) | (amendment) | ✓ (Art. 17) | ✓ (parental delete) | **planned — TODO** | cascade-delete across store + KG-derived data + backups; `app/security.py` |
| **Right to portability / access** | ✓ (access) | ✓ (Art. 20) | ✓ (parental review) | **planned** | export endpoint (FHIR-shaped) in `routers/clinical.py` |
| **BAA / DPA with processors** (incl. LLM provider, Neo4j host, DB host) | ✓ **(core)** | ✓ (Art. 28) | ✓ | **planned — not started** | **No BAA exists.** Required before `PROVIDER=claude` with real PHI |
| **DPIA / risk assessment** | (risk analysis) | ✓ (Art. 35) | — | **partial** | see `docs/threat-model.md` |

Legend: ✓ = required; — = not directly applicable.

## Data flow & PHI inventory

| Data element | Category | Where it lives | Crosses a boundary? | Notes / risk |
|--------------|----------|----------------|---------------------|--------------|
| Symptoms (input) | PHI / child health | request body → predictor → (optionally) LLM prompt | **Yes — to LLM if `explain`** | Must be excluded/minimized before remote LLM |
| Age in months | PHI (esp. <13) | request → predictor | Maybe (LLM) | Drives COPPA applicability |
| Predictions + triage | derived PHI | response | Maybe (LLM) | Deterministic; keep authoritative over LLM text |
| LLM explanation | derived | response | **Yes (claude)** / No (ollama) | Remote = egress to Anthropic; local = on-device |
| Doctor records | personal data | store (in-memory/SQLite/PG) | No | RBAC/audit needed |
| Appointments | PHI | store | No | Links child ↔ time ↔ provider |
| Patient/child records | **PHI (sensitive)** | store | No | Highest-value asset; encryption + erasure required |
| Growth-stage data | PHI / child | store + `services/stages.py` | No | Age-linked, sensitive |
| Knowledge graph | reference data | Neo4j / CSV | No | Integrity-critical (triage safety), not PHI |
| Secrets (API key, DB/Neo4j creds) | credentials | `.env` (gitignored) | Outbound auth | Never committed; fresh history |

### LLM data-handling rule (the sharp edge)

- **`PROVIDER=ollama` (default):** prompt stays **on-device** → no third-party PHI disclosure.
- **`PROVIDER=claude`:** prompt content is sent to **Anthropic's API over the network**. With real PHI this is a **HIPAA disclosure to a processor** and a **GDPR cross-border transfer** — **prohibited until a BAA/DPA is signed and PHI is minimized out of the prompt.** Until then, treat the claude path as **synthetic-data-only**.

## What "done" looks like (gate to production)

1. Verified parental/guardian consent enforced before any child-data operation.
2. Authn + RBAC on every route; audit log carries a real, authenticated actor and is append-only.
3. TLS in transit; encryption at rest; keys out of `.env` and in a keychain/secrets manager.
4. PHI minimized out of LLM prompts; remote LLM only behind a signed BAA.
5. Retention policy + working right-to-erasure and data-export paths.
6. Breach-notification process live (see `docs/incident-response.md`) with HIPAA-60-day / GDPR-72-hour timers.
7. Completed DPIA referencing `docs/threat-model.md`.

Until **all** of the above ship, the only lawful input is **synthetic data**.
