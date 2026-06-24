# API Reference

The full REST surface. The point: **`app/schemas.py` is the source of truth** —
this page describes it, and `web/lib/api.ts` must mirror it. When they disagree,
the schema wins and this doc is stale.

- **Base URL (dev):** `http://localhost:8000`
- **Interactive docs / OpenAPI:** `GET /docs` (Swagger UI), `GET /openapi.json`
- **Auth:** none yet (**planned** — see [definition-of-done.md](definition-of-done.md))
- **Content type:** `application/json`
- **Disclaimer:** `/predict` always returns a not-a-medical-device disclaimer.
  Synthetic data only.

## Endpoints at a glance

| Method | Path | Purpose | Router |
|--------|------|---------|--------|
| GET | `/health` | Liveness check | main |
| POST | `/predict` | Symptom → ranked diseases + triage | intelligence |
| GET | `/graph/{node}` | Knowledge-graph neighbours | intelligence |
| GET | `/doctors` | List doctors | clinical |
| GET | `/appointments` | List appointments | clinical |
| POST | `/appointments` | Book appointment (409 on conflict) | clinical |
| GET | `/records/{subject}` | List records for a subject | clinical |
| POST | `/records/{subject}` | Add a record for a subject | clinical |
| GET | `/stages/{age_months}` | Growth stage + milestones for age | clinical |

## Status codes used

| Code | Meaning here |
|------|--------------|
| 200 | Success |
| 201 | Resource created (appointment / record) |
| 404 | Unknown graph node / subject / no stage for age |
| 409 | Appointment conflict (slot already booked for that doctor) |
| 422 | Validation error (missing/wrong-typed field — FastAPI/Pydantic) |

---

## GET /health

Liveness. No auth, no body.

**Response 200**
```json
{ "status": "ok" }
```
```bash
curl http://localhost:8000/health
```

---

## POST /predict

Ranked disease possibilities with transparent matched-symptom evidence and a
triage level. **Decision support, not a diagnosis.**

**Request body** (`SymptomRequest`)

| Field | Type | Req | Notes |
|-------|------|:---:|-------|
| `symptoms` | `string[]` | yes | Symptom names (graph vocabulary) |
| `age_months` | `int?` | no | Optional; informs stage-aware logic |
| `explain` | `bool?` | no | If true, include LLM explanation text |

**Response 200** (`PredictResponse`)

| Field | Type | Notes |
|-------|------|-------|
| `predictions` | `DiseasePrediction[]` | Ranked; each `{disease, confidence, matched_symptoms[]}` |
| `triage` | `"self-care" \| "see-doctor" \| "urgent"` | Escalates to `urgent` on red-flag symptoms |
| `explanation` | `string` | LLM text (provider-dependent; degrades gracefully) |
| `disclaimer` | `string` | Not-a-medical-device notice (always present) |

`DiseasePrediction`: `{ "disease": string, "confidence": number, "matched_symptoms": string[] }`

> **Red flags** forcing `urgent`: `difficulty_breathing`, `chest_pain`,
> `seizure`, `unresponsive`, `blue_lips`, `stiff_neck`, `severe_dehydration`.

**Status:** 200 success · 422 missing/invalid `symptoms`.

```bash
curl -X POST http://localhost:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"symptoms":["fever","cough"],"age_months":36,"explain":true}'
```
```json
{
  "predictions": [
    { "disease": "common_cold", "confidence": 0.72, "matched_symptoms": ["fever","cough"] }
  ],
  "triage": "self-care",
  "explanation": "These symptoms are consistent with a common cold ...",
  "disclaimer": "This tool is for information only and is not a medical diagnosis."
}
```

---

## GET /graph/{node}

Knowledge-graph neighbours of a symptom or disease node.

**Path param:** `node` — node name (e.g. `fever`).

**Response 200** (`GraphResponse`)

| Field | Type | Notes |
|-------|------|-------|
| `node` | `string` | Echoed node |
| `related` | `RelatedNode[]` | Each `{name, relation, weight}` |

`RelatedNode`: `{ "name": string, "relation": string, "weight": number }`
(`relation` e.g. `HAS_SYMPTOM` / `INDICATES`.)

**Status:** 200 success · 404 unknown node.

```bash
curl http://localhost:8000/graph/fever
```
```json
{
  "node": "fever",
  "related": [
    { "name": "influenza", "relation": "INDICATES", "weight": 0.8 },
    { "name": "common_cold", "relation": "INDICATES", "weight": 0.5 }
  ]
}
```

---

## GET /doctors

List the doctors directory.

**Response 200:** `Doctor[]` — see [data-model.md](data-model.md).

```bash
curl http://localhost:8000/doctors
```

---

## GET /appointments

List appointments.

**Response 200:** `Appointment[]`.

```bash
curl http://localhost:8000/appointments
```

## POST /appointments

Book an appointment. Rejects overlapping slots for the same doctor.

**Request body** (`Appointment`, see [data-model.md](data-model.md)) — doctor,
patient/subject, start/end time.

**Status:** 201 created · 409 conflict (doctor already booked for that slot) ·
422 validation error.

```bash
curl -X POST http://localhost:8000/appointments \
  -H 'Content-Type: application/json' \
  -d '{"doctor_id":"d1","subject":"patient/123","start":"2026-07-01T09:00:00","end":"2026-07-01T09:30:00"}'
```
On conflict:
```json
{ "detail": "Appointment conflict: doctor already booked for this slot." }
```

---

## GET /records/{subject}

List medical records for a FHIR-style `subject` reference.

**Path param:** `subject` — e.g. `patient/123`.

**Response 200:** `MedicalRecord[]`. **404** if subject unknown.

```bash
curl http://localhost:8000/records/patient~123
```

## POST /records/{subject}

Add a record for a subject.

**Request body:** `MedicalRecord` (without server-set fields).
**Status:** 201 created · 422 validation error.

```bash
curl -X POST http://localhost:8000/records/patient~123 \
  -H 'Content-Type: application/json' \
  -d '{"type":"note","content":"Well-child visit, healthy."}'
```

---

## GET /stages/{age_months}

Growth stage and expected milestones for a given age.

**Path param:** `age_months` — integer age in months.

**Response 200** (`StageResponse`): the stage plus its `Milestone[]`
(see [data-model.md](data-model.md)). **404** if no stage maps to the age.

```bash
curl http://localhost:8000/stages/18
```

---

## Keeping this in sync

| Change to | Must also update |
|-----------|------------------|
| `app/schemas.py` | `web/lib/api.ts`, this file, `data-model.md` |
| Any endpoint | this table + the per-endpoint section + a test |

If `/openapi.json` and this page disagree, **trust `/openapi.json`** and fix this doc.
