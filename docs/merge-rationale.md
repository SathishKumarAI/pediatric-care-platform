# Merge Rationale

Why Medical-Research and Pediatrics became one product.

## The point

The two projects were never competitors — they were two halves of the same system that had been built separately. **Medical-Research** was the *brain*: it had the intelligence (symptom checker), the data (knowledge graph, synthetic pipeline), and the compliance thinking (HIPAA/GDPR framework), but no application to put them in. **Pediatrics** was the *body*: a working set of clinical workflows (doctors, appointments, records, growth stages), but as a Flutter mobile app with a Firebase backend and no intelligence layer.

Merging them produces what neither had alone: an intelligent, compliant clinical app. The new product is web/desktop (Next.js + Tauri), not mobile.

## Feature combination matrix

Capability × which parent it came from × status in the merged product.

| Capability | Medical-Research | Pediatrics | Merged status |
|------------|:----------------:|:----------:|---------------|
| AI symptom checker | ✅ | — | done |
| Symptom→disease knowledge graph | ✅ | — | done |
| Triage with red-flag escalation | ✅ | — | done |
| Synthetic data pipeline | ✅ | — | done |
| LLM explanations (ollama/claude) | ✅ | — | done |
| HIPAA/GDPR compliance framework | ✅ | — | stub (hooks in `security.py`) |
| Doctors directory | — | ✅ | done |
| Appointments + conflict detection | — | ✅ | done |
| Medical records | — | ✅ | done |
| Growth stages | — | ✅ | done |
| Unified web/desktop UI | — | — | done (new) |
| Single typed API | — | — | done (new) |

## Reused vs rebuilt

| From | What | Reused or rebuilt | Notes |
|------|------|-------------------|-------|
| Medical-Research | Symptom→disease knowledge | **Reused** (concept/data) | Repackaged as `knowledge_graph.py` + `symptom_disease.csv`; same domain model |
| Medical-Research | Predictor logic | **Rebuilt** | Reimplemented as a transparent weighted-overlap scorer behind a model-agnostic interface |
| Medical-Research | Synthetic data | **Reused** (approach) | `scripts/generate_data.py`, 10 synthetic diseases |
| Medical-Research | HIPAA/GDPR framework | **Reused** (design) → stubbed | Captured as hooks in `security.py`, not yet implemented |
| Pediatrics | Clinical workflows | **Rebuilt** | Domain logic (appointments, conflict detection, records, stages) reimplemented as FastAPI services |
| Pediatrics | Data layer | **Rebuilt** | Firebase replaced by the repository-pattern store |
| Pediatrics | UI | **Rebuilt** | Flutter screens reconceived as Next.js pages |

The intelligence *data and concepts* carried over largely intact; the *runtime* (predictor, services, store, UI) was rebuilt to live in one FastAPI + Next.js/Tauri stack.

## What was dropped

| Dropped | From | Why / replaced by |
|---------|------|-------------------|
| Flutter mobile app | Pediatrics | Product target is web/desktop; replaced by Next.js 15 + Tauri v2. Mobile is explicitly out of scope. |
| Firebase backend | Pediatrics | Replaced by FastAPI + the repository store (SQLite/Postgres-ready). Removes vendor lock-in and unifies the backend. |
| Spec-only vault (no app) | Medical-Research | The research/specs became live FastAPI services and `docs/`. |

## Git hygiene note

The predecessor Medical-Research repository had secrets committed to its git history. To avoid carrying those forward, this repository was created with a **fresh git history** — none of the old commits (and therefore none of the leaked secrets) exist here.
