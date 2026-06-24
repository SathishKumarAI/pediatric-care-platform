"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, Patient } from "./api";

const STORAGE_KEY = "pcp.selectedPatient";

interface PatientCtx {
  patients: Patient[];
  selected: Patient | null;
  select: (id: string | null) => void;
  refresh: () => Promise<void>;
  error: string | null;
}

const Ctx = createContext<PatientCtx | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPatients(await api.patients());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    setSelectedId(localStorage.getItem(STORAGE_KEY));
    refresh();
  }, [refresh]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  // selected resolves to null if the stored id is no longer present
  const selected = patients.find((p) => p.id === selectedId) ?? null;

  return (
    <Ctx.Provider value={{ patients, selected, select, refresh, error }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePatient(): PatientCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
}
