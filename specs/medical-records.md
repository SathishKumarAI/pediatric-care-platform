# Feature Spec — Medical Records

## Summary
Add a medical record for a patient and list a patient's records by subject.
Backed by `POST /records` and `GET /records/{subject}`. API-only today; no web
page yet.

## Problem / why
Care needs a running history of notes per child. This is the append-only store
those notes land in, keyed by the patient's (FHIR-style) subject id.

## Users & context
Clinicians/staff recording visit notes; (later) parents viewing a child's
history. Consumed by future timeline/record UI.

## Behaviour (acceptance criteria)
- WHEN a record with `subject`, `note`, and optional `attachments[]` is submitted THEN create it with a server-assigned id and `recorded` timestamp and return 201.
- WHEN `GET /records/{subject}` is called THEN return all records for that subject, in record order.
- WHEN a subject has no records THEN return `[]` (never 404).
- WHEN multiple records are added for the same subject THEN all are kept (append-only, none overwritten).

## Rules / logic (the real logic)
- `subject` is the patient id (FHIR-style string); it groups records, the client supplies it.
- Records are append-only: no update or delete path. Each `POST` adds a new record.
- `id` and `recorded` (datetime) are server-assigned; clients never set them.
- `attachments[]` are string references only — the actual file upload is not built.

## Out of scope (for now)
- FHIR import / export.
- File upload / attachment storage (attachments are bare string refs).
- Sharing / consent controls.
- Timeline / record UI (planned; no web page yet).

## Data touched
- Reads: store (records by subject).
- Writes: records (create).

## Edge cases
- Unknown subject on read → `[]`, not 404. · Empty `attachments` → stored as `[]`. · Two records, same subject → both returned. · Empty `note` → still creates (no content validation yet).

## Done when
- `POST /records` returns 201 with id + `recorded`; `GET /records/{subject}` lists what was added.
- Append-only holds: N posts for a subject → N records returned.
- `tests/test_api.py::test_records_*` pass.
