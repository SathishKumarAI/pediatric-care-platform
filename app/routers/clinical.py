"""Clinical workflow endpoints (from the Pediatrics app): doctors,
appointments, records, growth stages."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from ..schemas import (
    Appointment,
    AppointmentCreate,
    Doctor,
    MedicalRecord,
    StageResponse,
)
from ..services.stages import stage_for
from ..services.store import get_store

router = APIRouter(tags=["clinical"])


@router.get("/doctors", response_model=list[Doctor])
def doctors() -> list[Doctor]:
    return get_store().list_doctors()


@router.post("/appointments", response_model=Appointment, status_code=201)
def book(data: AppointmentCreate) -> Appointment:
    try:
        return get_store().create_appointment(data)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e


@router.get("/appointments", response_model=list[Appointment])
def appointments(patient_id: str | None = None) -> list[Appointment]:
    return get_store().list_appointments(patient_id)


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
    return datetime.now(timezone.utc)
