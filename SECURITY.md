# Security Policy

> **Current status (2026-06):** This is a **prototype running on SYNTHETIC data only.** It is **NOT a medical device**, has **no authentication, no encryption, and an in-memory store**, and is **NOT HIPAA / GDPR / COPPA compliant.** Do **not** load real patient data. The compliance controls below are *prerequisites before production*, not statements of current capability. See [`docs/privacy-compliance.md`](docs/privacy-compliance.md) for the gap analysis.

## Supported versions

Pre-1.0 software. Only the latest `main` is supported; there are no backported security fixes.

| Version | Supported | Notes |
|---------|-----------|-------|
| `main` (latest) | ✅ | Active development; fixes land here |
| Tagged pre-releases | ⚠️ best-effort | Upgrade to latest `main` |
| Anything older | ❌ | Unsupported |

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.**

- **Email:** sathishkumar786.ml@gmail.com with subject `SECURITY: pediatric-care-platform`
- **Or:** use GitHub *Private Vulnerability Reporting* (Security tab → Report a vulnerability)
- Include: affected component, reproduction steps, impact, and any PoC. **Never include real PHI** in a report — use synthetic data.

### Response SLA

| Stage | Target |
|-------|--------|
| Acknowledge receipt | 3 business days |
| Triage + severity assigned | 7 business days |
| Fix or mitigation (Critical/High) | 30 days |
| Fix (Medium/Low) | Next release cycle |
| Coordinated disclosure | After fix ships, or 90 days, whichever is first |

We will credit reporters who request it. Please allow time to fix before public disclosure.

## Scope

**In scope:** the FastAPI backend (`app/`), the Next.js/Tauri frontend (`web/`), build/CI config, dependency supply chain, the LLM explanation path, and the (stubbed) compliance hooks in `app/security.py`.

**Out of scope (today):** auth bypass and PHI-leak findings that depend on controls *not yet implemented* — these are tracked as known gaps in `docs/privacy-compliance.md`, not vulnerabilities. Findings in third-party services (Ollama, Anthropic API, Neo4j) belong to those vendors.

## Disclaimer

This software is a decision-support **prototype** trained on synthetic data (see `LICENSE`). It is **NOT a medical device** and must **NOT** be used for actual diagnosis or treatment. It handles **pediatric (children's) health data** by design — a category that is high-stakes and extra-sensitive (US **COPPA** applies to under-13s) — so the security bar before any real use is correspondingly high.

## Secrets policy

| Rule | Why |
|------|-----|
| **Never commit secrets.** API keys, DB/Neo4j creds, tokens live in `.env` (gitignored), never in code. | One leaked key = full data/LLM-billing compromise |
| Config is read from env in `app/config.py`; `.env.example` ships **only placeholders** | No accidental real values in VCS |
| Real PHI is **never** committed — synthetic data only | Legal + ethical; a committed PHI record is a reportable breach |
| **Fresh git history.** This repo was created with a clean history. The predecessor *Medical-Research* repo had Neo4j creds and GCP keys committed to its history; **none carried over** here. | Avoids inheriting leaked-secret exposure |

If a secret is ever committed: rotate it immediately, then purge history — do **not** rely on a follow-up commit to "remove" it.

## Dependency & supply-chain scanning

| Control | Tool | Status |
|---------|------|--------|
| Pre-commit hooks (incl. secret/format checks) | `.pre-commit-config.yaml` | ✅ present |
| Python dep audit | `pip-audit` / `safety` | ⚠️ recommended in CI |
| JS dep audit | `npm audit` | ⚠️ recommended in CI |
| Static analysis | `ruff`, `bandit` (Python), `eslint` (TS) | ⚠️ `ruff`/`eslint` present; add `bandit` |
| Automated dependency updates | Dependabot | ⚠️ recommended |
| Secret scanning | GitHub secret scanning + push protection | ✅ recommended (enable in repo settings) |

CI lives in `.github/workflows/ci.yml`. Security scanning steps marked ⚠️ should be added before handling any non-synthetic data.
