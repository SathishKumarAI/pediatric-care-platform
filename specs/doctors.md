# Feature Spec — Doctor Directory

## Summary
List the pediatric doctors and the days each is available. Lives at `/doctors`
(web) backed by `GET /doctors`. Currently a seeded, read-only directory.

## Problem / why
Families and staff need to know which doctors exist and when they're available
before booking a visit. Appointments needs a doctor to pick from; this is the
source of that list.

## Users & context
Parents/guardians browsing before booking; staff as a quick roster reference.

## Behaviour (acceptance criteria)
- WHEN `GET /doctors` is called THEN return every seeded doctor as `{id, name, specialty, available_days[]}`.
- WHEN the directory is seeded THEN it contains Dr. Aisha Rahman (General Pediatrics, Mon/Wed/Fri) and Dr. Leo Martins (Pediatric Pulmonology, Tue/Thu).
- WHEN the web page loads THEN it lists each doctor's name, specialty, and available days.
- WHEN no doctors exist THEN return `[]` (never error).

## Rules / logic (the real logic)
- The directory is read-only: doctors are seeded at store init, not created via the API.
- `available_days` is a fixed list of weekday names per doctor; it is descriptive only and does not (yet) enforce booking availability.
- IDs are server-assigned and stable across the process lifetime (in-memory store).

## Out of scope (for now)
- Doctor profiles (bio, photo, credentials).
- Search / filter by specialty or availability.
- Ratings / reviews.
- Creating, editing, or deleting doctors and their schedules.
- Availability enforcement at booking time (see Appointments).

## Data touched
- Reads: store (doctors).
- Writes: none (seeded; read-only).

## Edge cases
- Empty directory → returns `[]`. · Doctor with no available days → returned with `available_days: []`. · Duplicate seeding → not re-seeded; IDs remain stable.

## Done when
- `GET /doctors` returns the two seeded doctors with correct specialty and `available_days`.
- `tests/test_api.py::test_doctors_*` pass.
- `web/app/doctors/page.tsx` renders each doctor's name, specialty, and available days.
