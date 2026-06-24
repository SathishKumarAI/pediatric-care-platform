# Feature Spec — Patient / Child Profiles

## Summary
Create and select a child profile. The selected child becomes the active
context across the app — its age prefills the symptom checker and growth
stages, and its ID is the subject for records and appointments. Backed by
`/patients` endpoints + a client-side selected-patient context.

## Problem / why
Today the app hardcodes patient `p1` and asks the user to retype age and patient
IDs. Real use centers on a specific child; the app should hold that context.

## Users & context
Parents/guardians managing one or more children; staff selecting a patient.

## Behaviour (acceptance criteria)
- WHEN a child is created with a name and birth date THEN persist it and return it with a server-assigned id and a computed `age_months`.
- WHEN listing patients THEN return all created patients.
- WHEN fetching an unknown patient id THEN respond 404.
- WHEN a name or birth date is missing THEN respond 422.
- WHEN a child is selected in the UI THEN the choice persists across reloads (localStorage) and drives age + subject defaults on other pages.

## Rules / logic (the real logic)
- `age_months` = whole months between birth date and today (never negative).
- IDs are server-assigned (`pat-<uuid8>`); clients never set them.
- Sex is an enum (male | female | other | unknown); optional guardian name.
- Selected-patient state lives only on the client; the API is stateless.

## Out of scope (for now)
- Auth / ownership (any user can see all patients until PCP-8).
- Editing / deleting profiles, avatars, multiple guardians.
- Growth percentile charts (PCP-11).

## Data touched
- Reads: patients table.
- Writes: patients (create).
- Client: localStorage key `pcp.selectedPatient`.

## Edge cases
- No patients yet → patients page shows empty state + create form; other pages fall back to manual entry. · Birth date in the future → age clamps to 0. · Selected patient later missing → context clears gracefully.

## Done when
- `POST /patients` + `GET /patients` + `GET /patients/{id}` work and persist; unknown id → 404; missing fields → 422 (backend tests).
- Patients page lists/creates/selects; selection survives reload.
- Appointments use the selected patient (no hardcoded `p1`); records subject + symptom-checker age default from it.
