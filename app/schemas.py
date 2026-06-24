"""Pydantic API contract. Shared source of truth for backend + web client.

Field names mirror FHIR where practical (subject, status, etc.) per the
Medical-Research compliance/interoperability notes.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum

from pydantic import BaseModel, Field, computed_field


# --------------------------------------------------------------------------- #
# Symptom checker  (from Medical-Research AI/knowledge-graph layer)
# --------------------------------------------------------------------------- #
class SymptomRequest(BaseModel):
    symptoms: list[str] = Field(..., examples=[["fever", "cough", "sore throat"]])
    age_months: int | None = Field(None, ge=0, le=216, description="Patient age in months")
    explain: bool = True


class DiseasePrediction(BaseModel):
    disease: str
    confidence: float = Field(..., ge=0, le=1)
    matched_symptoms: list[str]


class SymptomResponse(BaseModel):
    predictions: list[DiseasePrediction]
    triage: str  # "self-care" | "see-doctor" | "urgent"
    explanation: str
    disclaimer: str = (
        "This is decision support, not a diagnosis. Always consult a licensed "
        "pediatrician. Call emergency services for severe symptoms."
    )


# --------------------------------------------------------------------------- #
# Knowledge graph
# --------------------------------------------------------------------------- #
class GraphNeighbors(BaseModel):
    node: str
    related: list[dict]  # [{"name":..., "relation":..., "weight":...}]


# --------------------------------------------------------------------------- #
# Clinical workflows  (from Pediatrics app)
# --------------------------------------------------------------------------- #
class Role(StrEnum):
    patient = "patient"
    guardian = "guardian"
    doctor = "doctor"
    admin = "admin"
    researcher = "researcher"


class Sex(StrEnum):
    male = "male"
    female = "female"
    other = "other"
    unknown = "unknown"


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    birth_date: date
    sex: Sex = Sex.unknown
    guardian_name: str | None = None


class Patient(PatientCreate):
    id: str

    @computed_field  # type: ignore[prop-decorator]
    @property
    def age_months(self) -> int:
        today = date.today()
        months = (today.year - self.birth_date.year) * 12 + (today.month - self.birth_date.month)
        if today.day < self.birth_date.day:
            months -= 1
        return max(0, months)


class Doctor(BaseModel):
    id: str
    name: str
    specialty: str = "Pediatrics"
    available_days: list[str] = []


class AppointmentStatus(StrEnum):
    booked = "booked"
    cancelled = "cancelled"
    fulfilled = "fulfilled"


class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    start: datetime
    reason: str | None = None


class Appointment(AppointmentCreate):
    id: str
    status: AppointmentStatus = AppointmentStatus.booked


class AppointmentUpdate(BaseModel):
    """Cancel (status) or reschedule (start). Both optional; at least one."""
    status: AppointmentStatus | None = None
    start: datetime | None = None


class MedicalRecord(BaseModel):
    id: str
    subject: str  # patient id (FHIR-style)
    recorded: datetime
    note: str
    attachments: list[str] = []


# --------------------------------------------------------------------------- #
# Pediatric growth stages  (fills the Pediatrics `stages/` stub w/ MR data)
# --------------------------------------------------------------------------- #
class Milestone(BaseModel):
    age_months: int
    domain: str  # motor | language | social | cognitive
    milestone: str


class StageResponse(BaseModel):
    age_months: int
    stage: str
    expected: list[Milestone]
    red_flags: list[str]
