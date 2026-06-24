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

export type Role = "patient" | "guardian" | "doctor" | "admin" | "researcher";

export interface UserPublic {
  id: string;
  email: string;
  role: Role;
}

export interface AuthToken {
  token: string;
  user: UserPublic;
}

export type Sex = "male" | "female" | "other" | "unknown";

export interface Patient {
  id: string;
  name: string;
  birth_date: string; // ISO date
  sex: Sex;
  guardian_name?: string | null;
  age_months: number;
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

export const TOKEN_KEY = "pcp.token";

function authHeaders(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<Record<string, unknown>>("/health"),

  signup: (email: string, password: string, role?: Role) =>
    req<AuthToken>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, role: role ?? "guardian" }),
    }),

  login: (email: string, password: string) =>
    req<AuthToken>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => req<UserPublic>("/auth/me"),

  logout: () => req<void>("/auth/logout", { method: "POST" }),

  predict: (symptoms: string[], age_months?: number) =>
    req<SymptomResponse>("/predict", {
      method: "POST",
      body: JSON.stringify({ symptoms, age_months, explain: true }),
    }),

  doctors: () => req<Doctor[]>("/doctors"),

  patients: () => req<Patient[]>("/patients"),

  patient: (id: string) => req<Patient>(`/patients/${id}`),

  createPatient: (data: {
    name: string;
    birth_date: string;
    sex?: Sex;
    guardian_name?: string;
  }) =>
    req<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify({ sex: "unknown", ...data }),
    }),

  appointments: (patient_id?: string) =>
    req<Appointment[]>(
      `/appointments${patient_id ? `?patient_id=${patient_id}` : ""}`,
    ),

  patchAppointment: (id: string, body: { status?: Appointment["status"]; start?: string }) =>
    req<Appointment>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

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
