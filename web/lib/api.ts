// Typed client for the Pediatric Care Platform backend.
// Mirrors app/schemas.py — keep in sync with the FastAPI contract.
import { API_URL } from "./config";

export type Triage = "self-care" | "see-doctor" | "urgent";

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  matched_symptoms: string[];
}

export interface SymptomResponse {
  predictions: DiseasePrediction[];
  triage: Triage;
  explanation: string;
  disclaimer: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  available_days: string[];
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start: string;
  reason?: string | null;
  status: "booked" | "cancelled" | "fulfilled";
}

export interface MedicalRecord {
  id: string;
  subject: string;
  recorded: string;
  note: string;
  attachments: string[];
}

export interface Milestone {
  age_months: number;
  domain: string;
  milestone: string;
}

export interface StageResponse {
  age_months: number;
  stage: string;
  expected: Milestone[];
  red_flags: string[];
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<Record<string, unknown>>("/health"),

  predict: (symptoms: string[], age_months?: number) =>
    req<SymptomResponse>("/predict", {
      method: "POST",
      body: JSON.stringify({ symptoms, age_months, explain: true }),
    }),

  doctors: () => req<Doctor[]>("/doctors"),

  appointments: (patient_id?: string) =>
    req<Appointment[]>(
      `/appointments${patient_id ? `?patient_id=${patient_id}` : ""}`,
    ),

  book: (patient_id: string, doctor_id: string, start: string, reason?: string) =>
    req<Appointment>("/appointments", {
      method: "POST",
      body: JSON.stringify({ patient_id, doctor_id, start, reason }),
    }),

  stages: (ageMonths: number) => req<StageResponse>(`/stages/${ageMonths}`),

  records: (subject: string) => req<MedicalRecord[]>(`/records/${subject}`),

  addRecord: (rec: {
    id: string;
    subject: string;
    recorded: string;
    note: string;
    attachments?: string[];
  }) =>
    req<MedicalRecord>("/records", {
      method: "POST",
      body: JSON.stringify({ attachments: [], ...rec }),
    }),
};
