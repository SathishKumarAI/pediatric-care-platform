"""Clinical data store — appointments, doctors, records.

In-memory default so the app runs with zero infra. The interface mirrors a
repository so it can be swapped for SQLModel/Postgres (DATABASE_URL) without
changing routers — same Repository Pattern the Pediatrics app used.
"""
from __future__ import annotations

import itertools

from ..schemas import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    Doctor,
    MedicalRecord,
)

_ids = itertools.count(1)


def _next(prefix: str) -> str:
    return f"{prefix}-{next(_ids)}"


class Store:
    def __init__(self) -> None:
        self.doctors: dict[str, Doctor] = {}
        self.appointments: dict[str, Appointment] = {}
        self.records: dict[str, MedicalRecord] = {}
        self._seed()

    def _seed(self) -> None:
        for d in [
            Doctor(id="doc-1", name="Dr. Aisha Rahman", specialty="General Pediatrics",
                   available_days=["Mon", "Wed", "Fri"]),
            Doctor(id="doc-2", name="Dr. Leo Martins", specialty="Pediatric Pulmonology",
                   available_days=["Tue", "Thu"]),
        ]:
            self.doctors[d.id] = d

    # --- doctors ---
    def list_doctors(self) -> list[Doctor]:
        return list(self.doctors.values())

    # --- appointments ---
    def create_appointment(self, data: AppointmentCreate) -> Appointment:
        if self._conflict(data):
            raise ValueError("Doctor already booked at that time")
        appt = Appointment(id=_next("appt"), **data.model_dump())
        self.appointments[appt.id] = appt
        return appt

    def _conflict(self, data: AppointmentCreate) -> bool:
        return any(
            a.doctor_id == data.doctor_id
            and a.start == data.start
            and a.status == AppointmentStatus.booked
            for a in self.appointments.values()
        )

    def list_appointments(self, patient_id: str | None = None) -> list[Appointment]:
        out = list(self.appointments.values())
        if patient_id:
            out = [a for a in out if a.patient_id == patient_id]
        return out

    # --- records ---
    def add_record(self, rec: MedicalRecord) -> MedicalRecord:
        self.records[rec.id] = rec
        return rec

    def list_records(self, subject: str) -> list[MedicalRecord]:
        return [r for r in self.records.values() if r.subject == subject]


_STORE: Store | None = None


def get_store() -> Store:
    global _STORE
    if _STORE is None:
        _STORE = Store()
    return _STORE
