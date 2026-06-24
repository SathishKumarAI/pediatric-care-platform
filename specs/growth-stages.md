# Feature Spec — Growth Stages

## Summary
Given a child's age in months, show the developmental stage, expected
milestones, and age-appropriate red flags. Lives at `/stages` (web) backed by
`GET /stages/{age_months}`. Fills the empty `stages/` stub the Pediatrics app
shipped, using Medical-Research developmental data.

## Problem / why
Parents want to know "is my child on track?" and which warning signs warrant a
pediatrician conversation, without parsing raw CDC/WHO checklists.

## Users & context
Parents/guardians checking development between visits.

## Behaviour (acceptance criteria)
- WHEN age_months is 0–216 THEN return stage label, expected milestones, and red flags.
- WHEN age_months is out of range THEN respond 422.
- Expected milestones = those reached by roughly the given age (age_months + 2 grace).
- Red flags = the nearest checkpoint at or below the child's age.

## Rules / logic (the real logic)
- Stage label: <12mo Infant · <36mo Toddler · <60mo Preschool · else School-age.
- Milestones carry (age_months, domain ∈ {motor,language,social,cognitive}, text).
- Red-flag set is keyed to checkpoints (6, 12, 24, 36 months); pick max checkpoint ≤ age.

## Out of scope (for now)
- Percentile growth charts (height/weight/BMI).
- Per-child tracking / history of which milestones were met.
- Editable milestone data via UI.

## Data touched
- Reads: in-code milestone + red-flag reference tables (`app/services/stages.py`).
- Writes: none.

## Edge cases
- age 0 → Infant, earliest milestones, checkpoint defaults to 6mo flags. · age 216 (18y) → School-age. · age 999 → 422. · No red-flag checkpoint ≤ age → fall back to the 6mo set.

## Done when
- `GET /stages/12` → stage "Toddler" with non-empty expected + red_flags.
- `GET /stages/999` → 422.
- `tests/test_api.py::test_stages_*` pass; web page lists milestones by domain and red flags.
