"""Clinical workflow endpoints (from the Pediatrics app): doctors,
appointments, records, growth stages."""
from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException

from ..schemas import (
    Appointment,
    AppointmentCreate,
    AppointmentUpdate,
    Doctor,
    MedicalRecord,
    Patient,
    PatientCreate,
    StageResponse,
)
from ..services.stages import stage_for
from ..services.store import get_store

router = APIRouter(tags=["clinical"])


@router.get("/doctors", response_model=list[Doctor])
def doctors() -> list[Doctor]:
    return get_store().list_doctors()


@router.post("/patients", response_model=Patient, status_code=201)
def create_patient(data: PatientCreate) -> Patient:
    return get_store().create_patient(data)


@router.get("/patients", response_model=list[Patient])
def patients() -> list[Patient]:
    return get_store().list_patients()


@router.get("/patients/{patient_id}", response_model=Patient)
def patient(patient_id: str) -> Patient:
    p = get_store().get_patient(patient_id)
    if p is None:
        raise HTTPException(status_code=404, detail=f"No patient '{patient_id}'")
    return p


@router.post("/appointments", response_model=Appointment, status_code=201)
def book(data: AppointmentCreate) -> Appointment:
    try:
        return get_store().create_appointment(data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e


@router.get("/appointments", response_model=list[Appointment])
def appointments(patient_id: str | None = None) -> list[Appointment]:
    return get_store().list_appointments(patient_id)


@router.patch("/appointments/{appt_id}", response_model=Appointment)
def update_appointment(appt_id: str, data: AppointmentUpdate) -> Appointment:
    if data.status is None and data.start is None:
        raise HTTPException(status_code=422, detail="Provide status and/or start")
    try:
        return get_store().update_appointment(appt_id, status=data.status, start=data.start)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"No appointment '{appt_id}'") from e
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e


@router.get("/records/{subject}", response_model=list[MedicalRecord])
def records(subject: str) -> list[MedicalRecord]:
    return get_store().list_records(subject)


@router.post("/records", response_model=MedicalRecord, status_code=201)
def add_record(rec: MedicalRecord) -> MedicalRecord:
    return get_store().add_record(rec)


@router.get("/stages/{age_months}", response_model=StageResponse)
def stages(age_months: int) -> StageResponse:
    if not 0 <= age_months <= 216:
        raise HTTPException(status_code=422, detail="age_months out of range")
    return stage_for(age_months)


def _now() -> datetime:
    return datetime.now(UTC)
