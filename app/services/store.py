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

    def list_doctors(self) -> list[Doctor]:
        return list(self.doctors.values())

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

    def create_appointment(self, data: AppointmentCreate) -> Appointment:
        if self._conflict(data):
            raise ValueError("Doctor already booked at that time")
        appt = Appointment(id=f"appt-{uuid.uuid4().hex[:8]}", **data.model_dump())
        self.conn.execute(
            "INSERT INTO appointments (id, patient_id, doctor_id, start, reason, status)"
            " VALUES (?,?,?,?,?,?)",
            (appt.id, appt.patient_id, appt.doctor_id, appt.start.isoformat(),
             appt.reason, appt.status.value),
        )
        self.conn.commit()
        return appt

    def _conflict(self, data: AppointmentCreate) -> bool:
        row = self.conn.execute(
            "SELECT 1 FROM appointments WHERE doctor_id=? AND start=? AND status=? LIMIT 1",
            (data.doctor_id, data.start.isoformat(), AppointmentStatus.booked.value),
        ).fetchone()
        return row is not None

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
