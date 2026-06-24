"""Pydantic API contract. Shared source of truth for backend + web client.

Field names mirror FHIR where practical (subject, status, etc.) per the
Medical-Research compliance/interoperability notes.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


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
class Role(str, Enum):
    patient = "patient"
    guardian = "guardian"
    doctor = "doctor"
    admin = "admin"
    researcher = "researcher"


class Doctor(BaseModel):
    id: str
    name: str
    specialty: str = "Pediatrics"
    available_days: list[str] = []


class AppointmentStatus(str, Enum):
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
