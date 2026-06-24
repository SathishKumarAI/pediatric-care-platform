"use client";
import { useCallback, useEffect, useState } from "react";
import { api, Doctor } from "@/lib/api";
import { EmptyState, ErrorBanner, Loading } from "../_components/States";

export default function Doctors() {
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setDocs(await api.doctors());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Doctors</h1>
      <p className="text-subtext mb-6">Pediatricians and their availability.</p>

      {loading && <Loading label="Loading doctors…" />}
      {err && <ErrorBanner message={err} onRetry={load} />}
      {!loading && !err && docs.length === 0 && <EmptyState>No doctors available.</EmptyState>}

      <div className="grid grid-cols-2 gap-4">
        {docs.map((d) => (
          <div key={d.id} className="rounded-lg border border-surface0 bg-mantle p-4">
            <div className="font-semibold">{d.name}</div>
            <div className="text-sm text-subtext">{d.specialty}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {d.available_days.map((day) => (
                <span key={day} className="rounded bg-surface0 px-2 py-0.5 text-xs text-blue">{day}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
