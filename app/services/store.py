"""Clinical data store — appointments, doctors, records.

Two implementations behind one interface (Repository Pattern, so routers never
change): `InMemoryStore` (zero infra) and `SqliteStore` (persistent). Selected
by `DATABASE_URL`: a `sqlite:///…` URL → SqliteStore (default), anything else
→ in-memory.
"""
from __future__ import annotations

import itertools
import json
import uuid

from ..config import get_settings
from ..schemas import (
    Appointment,
    AppointmentCreate,
    AppointmentStatus,
    Doctor,
    MedicalRecord,
    Patient,
    PatientCreate,
)
from . import db

_SEED_DOCTORS = [
    Doctor(id="doc-1", name="Dr. Aisha Rahman", specialty="General Pediatrics",
           available_days=["Mon", "Wed", "Fri"]),
    Doctor(id="doc-2", name="Dr. Leo Martins", specialty="Pediatric Pulmonology",
           available_days=["Tue", "Thu"]),
]

_ids = itertools.count(1)


def _next(prefix: str) -> str:
    return f"{prefix}-{next(_ids)}"


# --------------------------------------------------------------------------- #
# In-memory
# --------------------------------------------------------------------------- #
class InMemoryStore:
    def __init__(self) -> None:
        self.doctors: dict[str, Doctor] = {d.id: d for d in _SEED_DOCTORS}
        self.appointments: dict[str, Appointment] = {}
        self.records: dict[str, MedicalRecord] = {}
        self.patients: dict[str, Patient] = {}

    def list_doctors(self) -> list[Doctor]:
        return list(self.doctors.values())

    # --- patients ---
    def create_patient(self, data: PatientCreate) -> Patient:
        pat = Patient(id=f"pat-{uuid.uuid4().hex[:8]}", **data.model_dump())
        self.patients[pat.id] = pat
        return pat

    def list_patients(self) -> list[Patient]:
        return list(self.patients.values())

    def get_patient(self, patient_id: str) -> Patient | None:
        return self.patients.get(patient_id)

    def get_doctor(self, doctor_id: str) -> Doctor | None:
        return self.doctors.get(doctor_id)

    def _guard(self, doctor_id: str, start, exclude_id: str | None = None) -> None:
        doc = self.doctors.get(doctor_id)
        day = start.strftime("%a")
        if doc and doc.available_days and day not in doc.available_days:
            raise ValueError(f"Doctor not available on {day}")
        if any(
            a.doctor_id == doctor_id and a.start == start
            and a.status == AppointmentStatus.booked and a.id != exclude_id
            for a in self.appointments.values()
        ):
            raise ValueError("Doctor already booked at that time")

    def create_appointment(self, data: AppointmentCreate) -> Appointment:
        self._guard(data.doctor_id, data.start)
        appt = Appointment(id=_next("appt"), **data.model_dump())
        self.appointments[appt.id] = appt
        return appt

    def update_appointment(self, appt_id: str, status=None, start=None) -> Appointment:
        appt = self.appointments.get(appt_id)
        if appt is None:
            raise KeyError(appt_id)
        updates: dict = {}
        if start is not None:
            self._guard(appt.doctor_id, start, exclude_id=appt_id)
            updates["start"] = start
        if status is not None:
            updates["status"] = status
        appt = appt.model_copy(update=updates)
        self.appointments[appt_id] = appt
        return appt

    def list_appointments(self, patient_id: str | None = None) -> list[Appointment]:
        out = list(self.appointments.values())
        return [a for a in out if a.patient_id == patient_id] if patient_id else out

    def add_record(self, rec: MedicalRecord) -> MedicalRecord:
        self.records[rec.id] = rec
        return rec

    def list_records(self, subject: str) -> list[MedicalRecord]:
        return [r for r in self.records.values() if r.subject == subject]


# --------------------------------------------------------------------------- #
# SQLite-backed (persistent)
# --------------------------------------------------------------------------- #
class SqliteStore:
    def __init__(self, path: str) -> None:
        self.conn = db.connect(path)
        self._seed()

    def _seed(self) -> None:
        if self.conn.execute("SELECT COUNT(*) FROM doctors").fetchone()[0]:
            return
        for d in _SEED_DOCTORS:
            self.conn.execute(
                "INSERT INTO doctors (id, name, specialty, available_days) VALUES (?,?,?,?)",
                (d.id, d.name, d.specialty, json.dumps(d.available_days)),
            )
        self.conn.commit()

    def list_doctors(self) -> list[Doctor]:
        rows = self.conn.execute("SELECT * FROM doctors ORDER BY id").fetchall()
        return [
            Doctor(id=r["id"], name=r["name"], specialty=r["specialty"],
                   available_days=json.loads(r["available_days"]))
            for r in rows
        ]

    def create_patient(self, data: PatientCreate) -> Patient:
        pat = Patient(id=f"pat-{uuid.uuid4().hex[:8]}", **data.model_dump())
        self.conn.execute(
            "INSERT INTO patients (id, name, birth_date, sex, guardian_name) VALUES (?,?,?,?,?)",
            (pat.id, pat.name, pat.birth_date.isoformat(), pat.sex.value, pat.guardian_name),
        )
        self.conn.commit()
        return pat

    def _patient_from_row(self, r) -> Patient:
        return Patient(id=r["id"], name=r["name"], birth_date=r["birth_date"],
                       sex=r["sex"], guardian_name=r["guardian_name"])

    def list_patients(self) -> list[Patient]:
        rows = self.conn.execute("SELECT * FROM patients ORDER BY name").fetchall()
        return [self._patient_from_row(r) for r in rows]

    def get_patient(self, patient_id: str) -> Patient | None:
        r = self.conn.execute("SELECT * FROM patients WHERE id=?", (patient_id,)).fetchone()
        return self._patient_from_row(r) if r else None

    def get_doctor(self, doctor_id: str) -> Doctor | None:
        r = self.conn.execute("SELECT * FROM doctors WHERE id=?", (doctor_id,)).fetchone()
        return (
            Doctor(id=r["id"], name=r["name"], specialty=r["specialty"],
                   available_days=json.loads(r["available_days"]))
            if r else None
        )

    def _guard(self, doctor_id: str, start, exclude_id: str | None = None) -> None:
        doc = self.get_doctor(doctor_id)
        day = start.strftime("%a")
        if doc and doc.available_days and day not in doc.available_days:
            raise ValueError(f"Doctor not available on {day}")
        row = self.conn.execute(
            "SELECT 1 FROM appointments WHERE doctor_id=? AND start=? AND status='booked'"
            " AND id != ? LIMIT 1",
            (doctor_id, start.isoformat(), exclude_id or ""),
        ).fetchone()
        if row is not None:
            raise ValueError("Doctor already booked at that time")

    def create_appointment(self, data: AppointmentCreate) -> Appointment:
        self._guard(data.doctor_id, data.start)
        appt = Appointment(id=f"appt-{uuid.uuid4().hex[:8]}", **data.model_dump())
        self.conn.execute(
            "INSERT INTO appointments (id, patient_id, doctor_id, start, reason, status)"
            " VALUES (?,?,?,?,?,?)",
            (appt.id, appt.patient_id, appt.doctor_id, appt.start.isoformat(),
             appt.reason, appt.status.value),
        )
        self.conn.commit()
        return appt

    def update_appointment(self, appt_id: str, status=None, start=None) -> Appointment:
        r = self.conn.execute("SELECT * FROM appointments WHERE id=?", (appt_id,)).fetchone()
        if r is None:
            raise KeyError(appt_id)
        appt = Appointment(id=r["id"], patient_id=r["patient_id"], doctor_id=r["doctor_id"],
                           start=r["start"], reason=r["reason"], status=r["status"])
        new_start = appt.start
        if start is not None:
            self._guard(appt.doctor_id, start, exclude_id=appt_id)
            new_start = start
        new_status = status if status is not None else appt.status
        self.conn.execute(
            "UPDATE appointments SET start=?, status=? WHERE id=?",
            (new_start.isoformat(), new_status.value if hasattr(new_status, "value") else new_status, appt_id),
        )
        self.conn.commit()
        return appt.model_copy(update={"start": new_start, "status": new_status})

    def list_appointments(self, patient_id: str | None = None) -> list[Appointment]:
        if patient_id:
            rows = self.conn.execute(
                "SELECT * FROM appointments WHERE patient_id=?", (patient_id,)
            ).fetchall()
        else:
            rows = self.conn.execute("SELECT * FROM appointments").fetchall()
        return [
            Appointment(id=r["id"], patient_id=r["patient_id"], doctor_id=r["doctor_id"],
                        start=r["start"], reason=r["reason"], status=r["status"])
            for r in rows
        ]

    def add_record(self, rec: MedicalRecord) -> MedicalRecord:
        self.conn.execute(
            "INSERT OR REPLACE INTO records (id, subject, recorded, note, attachments)"
            " VALUES (?,?,?,?,?)",
            (rec.id, rec.subject, rec.recorded.isoformat(), rec.note,
             json.dumps(rec.attachments)),
        )
        self.conn.commit()
        return rec

    def list_records(self, subject: str) -> list[MedicalRecord]:
        rows = self.conn.execute(
            "SELECT * FROM records WHERE subject=? ORDER BY recorded DESC", (subject,)
        ).fetchall()
        return [
            MedicalRecord(id=r["id"], subject=r["subject"], recorded=r["recorded"],
                          note=r["note"], attachments=json.loads(r["attachments"]))
            for r in rows
        ]


Store = InMemoryStore  # backwards-compatible alias

_STORE: InMemoryStore | SqliteStore | None = None


def get_store() -> InMemoryStore | SqliteStore:
    global _STORE
    if _STORE is None:
        url = get_settings().database_url
        if url.startswith("sqlite:///"):
            _STORE = SqliteStore(db.sqlite_path(url))
        else:
            _STORE = InMemoryStore()
    return _STORE
