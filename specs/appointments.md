# Feature Spec — Appointments

## Summary
Book and view pediatric appointments with a chosen doctor and time. Lives at
`/appointments` (web) backed by `POST /appointments` and `GET /appointments`.

## Problem / why
Families need to schedule visits without double-booking a doctor; staff need a
reliable booked/cancelled/fulfilled state.

## Users & context
Parents/guardians booking a visit; (later) staff managing the schedule.

## Behaviour (acceptance criteria)
- WHEN a valid patient_id, doctor_id, and start time are submitted THEN create the appointment with status "booked" and return 201.
- WHEN the same doctor already has a "booked" appointment at that exact start THEN reject with 409 (conflict).
- WHEN listing with `?patient_id=X` THEN return only that patient's appointments.
- WHEN listing with no filter THEN return all appointments.

## Rules / logic (the real logic)
- Conflict = same doctor_id AND same start AND status == booked. Cancelled/fulfilled slots do not block.
- IDs are server-assigned (`appt-N`). Clients never set them.
- Times are stored/compared as timezone-aware datetimes (ISO 8601).

## Cancel / reschedule (PCP-9)
- WHEN `PATCH /appointments/{id}` with `{status:"cancelled"}` THEN mark it cancelled (its slot frees up).
- WHEN `PATCH /appointments/{id}` with a new `start` THEN move it, re-checking the conflict rule (409 on clash).
- WHEN the id is unknown THEN 404.

## Availability enforcement (PCP-10)
- WHEN booking/rescheduling on a day the doctor does not work (`available_days`) THEN reject 409 with a clear reason.

## Out of scope (for now)
- Reminders / notifications.
- Recurring appointments.
- Reschedule UI beyond a new-time prompt; granular working-hours (times, not just days).

## Data touched
- Reads: store (doctors, appointments).
- Writes: appointments (create).

## Edge cases
- Double-book same slot → 409. · Unknown doctor_id → still creates (validation deferred; noted as future work). · Empty patient list → returns []. · Same patient, two different doctors, same time → allowed (conflict is per-doctor).

## Done when
- `tests/test_api.py::test_appointment_conflict` passes (201 then 409).
- Web page books, shows a success/conflict message, and lists the patient's appointments.
