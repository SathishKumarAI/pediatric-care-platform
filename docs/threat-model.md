# Threat Model (STRIDE)

> **Reality check:** Today this app has **no auth, no encryption, an in-memory store, and synthetic data only**. Most mitigations below are **planned** — they are the controls that must exist *before* real pediatric PHI touches the system. Status is marked honestly: `done` / `partial` / `planned`.

Methodology: STRIDE per element across the trust boundaries. Scope = the Tauri desktop app, its FastAPI backend, the store/Neo4j/LLM dependencies, and the symptom→disease knowledge graph (KG).

## Assets (what we are protecting)

| Asset | Sensitivity | Why it matters |
|-------|-------------|----------------|
| **Pediatric PHI / child health data** | **Highest** | Symptoms, ages, growth, appointments, records. COPPA (<13) + HIPAA + GDPR-special-category. Children cannot consent for themselves. |
| Symptom→disease **knowledge graph** | Medium (IP + integrity) | Tampering corrupts triage → wrong "urgent vs self-care" guidance → patient-safety impact |
| **Predictor / model** logic | Medium | Inversion or scraping leaks dataset; corrupted scoring degrades safety |
| **Credentials / secrets** | High | `ANTHROPIC_API_KEY`, Neo4j creds, future `DATABASE_URL` creds |
| **Audit log** | High (integrity) | Required for HIPAA accountability; must be tamper-evident |
| LLM prompt/response channel | High | PHI may flow into prompts; responses shape clinical guidance |

## Trust boundaries

```
[ User / clinician ]
      │  (boundary 1: human ↔ desktop UI)
      ▼
[ Tauri v2 shell + Next.js UI ]   ← runs on the local device
      │  HTTP (boundary 2: client ↔ API; localhost sidecar OR network in server mode)
      ▼
[ FastAPI backend (app/) ]
      ├──► in-memory store | SQLite | Postgres   (boundary 3: app ↔ persistence)
      ├──► Neo4j | in-memory CSV KG              (boundary 3)
      └──► LLM: ollama (local) | claude (remote) (boundary 4: app ↔ external LLM — PHI EGRESS)
```

- **Boundary 2** is the critical one: today it is unauthenticated. As a desktop sidecar it's localhost-only; in server mode (`docker-compose.yml`) it is network-exposed and currently wide open.
- **Boundary 4** is the data-egress risk: `PROVIDER=claude` sends prompt content to Anthropic's API over the network. `PROVIDER=ollama` keeps it local. **If a prompt ever contains PHI, the claude path is a cross-border PHI disclosure requiring a BAA.**

## STRIDE threat table

| # | Category | Threat | Asset | Risk | Mitigation | Status |
|---|----------|--------|-------|------|-----------|--------|
| S1 | **Spoofing** | No auth → anyone reaching the API impersonates any user/clinician | PHI, audit | High (in server mode) | Authn (OIDC/session), per-actor identity feeding `record_access` | **planned** |
| S2 | Spoofing | CORS allows non-app origins to call the API | PHI | Medium | Lock `CORS_ORIGINS` to the Tauri origin only; reject `*` | **partial** (env-set, not enforced strictly) |
| T1 | **Tampering** | KG/CSV edited → corrupted triage, unsafe guidance | KG | High (safety) | Signed/checksummed dataset, read-only at runtime, integrity test in CI | **planned** |
| T2 | Tampering | Client mutates records via open write endpoints | PHI | High (server mode) | RBAC + write authz; input validation (Pydantic present) | **partial** |
| T3 | Tampering | Audit log can be altered/deleted | audit | High | Append-only, write-once storage; off-host shipping | **planned** (stub is plain logger) |
| R1 | **Repudiation** | Actor denies accessing/changing a child's record; no reliable trail | audit | High | `record_access()` with authenticated actor + immutable store | **partial** (stub logs `actor` string, no identity) |
| I1 | **Info disclosure** | PHI sent to remote LLM (`PROVIDER=claude`) without BAA / minimization | PHI, LLM channel | **High** | Default to local `ollama`; strip/avoid PHI in prompts; BAA before remote LLM; log egress | **partial** (ollama default; no PHI scrubbing) |
| I2 | Info disclosure | No encryption at rest (in-memory / plaintext SQLite) | PHI | High | Field/DB encryption, OS keychain for keys | **planned** |
| I3 | Info disclosure | No TLS in server mode → sniffing on boundary 2 | PHI | High (server mode) | TLS termination; HSTS | **planned** |
| I4 | Info disclosure | Verbose errors / stack traces leak internals or data | PHI | Medium | Generic error responses; no PHI in logs/metrics | **partial** |
| D1 | **DoS** | Unbounded `/predict` + 60s LLM timeout exhausts the sidecar | availability | Medium | Rate limiting, request size caps, LLM circuit breaker (graceful fallback exists) | **partial** (fallback done; no rate limit) |
| D2 | DoS | Pathological symptom payload blows up KG traversal | availability | Low | Input bounds, query limits | **planned** |
| E1 | **Elevation** | No RBAC → any caller has full read/write incl. erasure-worthy data | PHI | High | Role model (clinician/admin/parent), enforced per-route | **planned** (TODO in `security.py`) |
| E2 | Elevation | Tauri IPC / local server reachable by other local processes | PHI | Medium | Bind loopback only; Tauri allowlist; OS-level isolation | **partial** |

## Attack surface

| Surface | Exposure | Notes |
|---------|----------|-------|
| FastAPI HTTP endpoints (`/predict`, `/graph`, `/doctors`, `/appointments`, `/records`, `/stages`) | localhost (desktop) / network (server) | Unauthenticated today |
| LLM egress (`providers.py`) | Outbound to Anthropic when `PROVIDER=claude` | PHI-egress channel |
| Knowledge-graph data file (`data/symptom_disease.csv`) | Local file read at startup | Tampering = safety bug |
| Config / secrets (`app/config.py`, `.env`) | Env-loaded | Keys never in code; `.env` gitignored |
| Dependencies (Python `requirements.txt`, JS `web/`) | Supply chain | See `SECURITY.md` scanning table |
| Tauri shell + IPC | Local device | Native bridge to OS |

## Abuse cases

| Abuse case | How | Impact | Defense |
|------------|-----|--------|---------|
| **Symptom-data exfiltration** | Attacker hits open API in server mode, scrapes records/appointments | Mass pediatric PHI breach (reportable) | S1/I2/I3/E1 — authn + RBAC + TLS + encryption |
| **Prompt injection into the LLM explanation path** | Malicious text in symptom/record fields steers the LLM to ignore the disclaimer, emit unsafe advice, or echo other data into the explanation | Unsafe clinical guidance; possible cross-context data leak | Treat LLM output as untrusted display text; never let it drive control flow or triage; constrain/structure prompts; keep deterministic triage authoritative (it already is — step 4 precedes step 5); strip user text from system instructions |
| **Model inversion / membership inference** | Repeated `/predict` queries reconstruct training rows or infer who is in the dataset | Privacy leak of underlying (future real) data | Rate limit, response minimization, avoid echoing matched raw records; keep predictor outputs aggregate |
| **KG poisoning** | Tamper with `symptom_disease.csv` so a red-flag symptom no longer escalates to "urgent" | Patient-safety failure (under-triage) | T1 — integrity check, read-only data, CI assertion on red-flag escalation |
| **Audit tampering to hide access** | Edit/delete log after improperly viewing a child's record | Loss of HIPAA accountability | T3/R1 — append-only, off-host audit |
| **Credential theft** | Read `ANTHROPIC_API_KEY` from a leaked `.env` or process env | LLM billing abuse + PHI egress under your account | OS keychain, least-priv keys, rotation, never commit (fresh-history note) |

## Top risks (ranked)

| Rank | Risk | Driver | Gate before production |
|------|------|--------|------------------------|
| 1 | **PHI breach via unauthenticated, unencrypted API** (S1+I2+I3+E1) | No auth, no encryption, no RBAC | Authn + RBAC + TLS + encryption at rest |
| 2 | **PHI egress to remote LLM without BAA / minimization** (I1) | `PROVIDER=claude` ships prompt content off-device | Default local LLM; PHI scrubbing; signed BAA |
| 3 | **Under-triage from KG tampering / prompt injection** (T1, abuse) | Safety-critical guidance derived from mutable data + LLM text | Integrity checks; keep deterministic triage authoritative |
| 4 | **No audit accountability** (R1, T3) | Stub logger, no identity, mutable | Authenticated, append-only audit |
| 5 | **DoS on the local sidecar / LLM path** (D1) | No rate limiting | Rate limits + size caps (fallback already mitigates LLM hangs) |

These map 1:1 to the gaps tracked in `docs/privacy-compliance.md` and the `app/security.py` TODOs.
