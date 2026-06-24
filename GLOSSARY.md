# Glossary

Domain and project terms used across the codebase and docs.

## Triage levels

The `/predict` response classifies urgency into one of three levels:

| Level | Meaning |
|-------|---------|
| `self-care` | Symptoms suggest a minor, self-limiting condition; manage at home, monitor. |
| `see-doctor` | Warrants a clinician visit, but not an emergency. |
| `urgent` | Needs immediate attention. **Any red-flag symptom forces this level**, regardless of disease confidence. |

**Red-flag symptom** — a symptom that escalates triage straight to `urgent` (e.g. `difficulty_breathing`, `chest_pain`, `seizure`). The predictor checks for these before considering disease scores.

## Knowledge graph

A graph of symptoms and diseases linked by typed, weighted edges. Loaded from `data/symptom_disease.csv` into memory by default; backed by Neo4j when `NEO4J_URI` is set.

| Relation | Direction | Meaning |
|----------|-----------|---------|
| `HAS_SYMPTOM` | Disease → Symptom | The disease commonly presents with this symptom. |
| `INDICATES` | Symptom → Disease | The symptom points toward this disease (inverse view; carries a weight). |
| `TREATS` | Treatment → Disease | The treatment addresses this disease. |

**Edge weight** — a number on a relation expressing how strongly two nodes are associated. The predictor sums weights of matched symptom edges to score each candidate disease.

**Node** — a single symptom or disease in the graph. `GET /graph/{node}` returns a node's neighbors as `{name, relation, weight}`.

## Prediction

| Term | Meaning |
|------|---------|
| **Prediction** | A candidate disease with a `confidence` score and the `matched_symptoms` that produced it. |
| **Confidence** | Normalized score from the weighted symptom-overlap. *Not* a calibrated clinical probability. |
| **Matched symptoms** | The input symptoms that connect to the predicted disease in the graph. |
| **Transparent predictor** | The default scorer: weighted symptom-overlap over the graph — explainable by construction, no black box. |
| **Model-agnostic interface** | The predictor contract that lets a different model (e.g. a GNN) be swapped in without changing the API. |

## Growth stages

| Term | Meaning |
|------|---------|
| **Growth stage** | A developmental band mapped from an age in months (e.g. infant, toddler). |
| **Milestone** | An expected developmental achievement at a given age, in a `domain` (motor, language, social, cognitive). |
| **Red flag** (growth) | The absence of an expected milestone, or a sign warranting developmental review. |
| `age_months` | Age expressed in months — the input to `GET /stages/{age_months}`. |

## Data & compliance

| Term | Meaning |
|------|---------|
| **FHIR subject** | A reference to the patient an artifact is about (FHIR = Fast Healthcare Interoperability Resources). `subject` keys medical records. |
| **PHI** | Protected Health Information — identifiable health data. This prototype uses **synthetic** data only; real PHI requires the controls in `app/security.py`. |
| **Synthetic data** | Generated, non-real data (`scripts/generate_data.py`). Carries no privacy risk and no clinical authority. |
| **HIPAA** | US health-data privacy/security law. |
| **GDPR** | EU data-protection regulation. |
| **Right-to-erasure** | GDPR right to have personal data deleted on request (hook stubbed in `app/security.py`). |
| **RBAC** | Role-Based Access Control — permissions by clinical role. |
| **Audit logging** | Tamper-evident record of who accessed/changed what, for accountability. |

## Platform terms

| Term | Meaning |
|------|---------|
| `PROVIDER` | Env var selecting the LLM backend: `ollama` (default, local, free, `llama3.1:8b`) or `claude` (`claude-opus-4-8`, needs `ANTHROPIC_API_KEY`). |
| **Provider abstraction** | The `app/providers.py` layer that hides which LLM is in use; explanations degrade gracefully if none is reachable. |
| **Repository pattern** | The `store.py` design that hides the storage backend (in-memory / SQLite / Postgres) behind one interface. |
| **Sidecar** | The FastAPI backend process that the Tauri desktop app launches alongside the UI. |
| **Decision support** | Software that *informs* a clinician's judgment. **Not** a diagnosis: it suggests, ranks, and explains; it does not decide or treat. |
| **Diagnosis** | A clinician's determination of a condition. This platform explicitly does **not** do this. |
