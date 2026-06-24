# Feature Spec — Symptom Checker

## Summary
Parent selects a child's symptoms and (optionally) age; the app returns ranked
possible conditions, a triage level, and a plain-language explanation. Lives at
`/symptom-checker` (web) backed by `POST /predict`.

## Problem / why
Parents face symptoms with no easy, structured sense of "how worried should I
be / do I need a doctor now." This gives transparent, explainable decision
support — not a diagnosis.

## Users & context
Parents/guardians at home, often anxious, deciding whether to self-care, book a
visit, or seek urgent care. Also clinicians as a quick reference.

## Behaviour (acceptance criteria)
- WHEN ≥1 symptom is submitted THEN return up to 3 conditions ranked by confidence (0–1) with the matched symptoms for each.
- WHEN a red-flag symptom is present (difficulty_breathing, chest_pain, seizure, unresponsive, blue_lips, stiff_neck, severe_dehydration) THEN triage = "urgent" regardless of ranking.
- WHEN top confidence ≥ 0.5 and no red flag THEN triage = "see-doctor"; otherwise "self-care".
- WHEN no symptoms are submitted THEN respond 422 (no guessing).
- WHEN `explain=true` THEN include a 2–3 sentence parent-facing explanation; if the LLM is unreachable, fall back to a templated explanation (never error).
- Every response carries a fixed medical disclaimer.

## Rules / logic (the real logic)
- Confidence = (sum of matched symptom weights for a disease) / (sum of all that disease's symptom weights), from the knowledge graph.
- Symptom weights = prevalence of each symptom within a disease, learned from the synthetic dataset at load.
- Symptoms are normalized (lowercase, spaces→underscores) before matching.
- Triage is computed independently of confidence ordering; red flag wins.

## Out of scope (for now)
- Free-text symptom entry / NLP extraction (curated symptom chips only).
- Personal history, medications, vitals as inputs.
- Persisting check results to a record (see records feature later).

## Data touched
- Reads: `data/symptom_disease.csv` (via in-memory knowledge graph), LLM provider.
- Writes: none (stateless).

## Edge cases
- First use / empty selection → 422. · Unknown symptom string → ignored (no match). · All symptoms match nothing → empty predictions, triage "self-care". · LLM down → templated explanation. · Age omitted → still works.

## Done when
- `POST /predict` returns ranked predictions + correct triage for the cases in `eval/cases.yaml` (top-3 = 100%).
- Red-flag input yields "urgent"; empty input yields 422.
- `tests/test_api.py::test_predict_*` pass; web page renders ranked bars, triage badge, explanation, disclaimer.
