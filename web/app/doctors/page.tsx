"use client";
import { useEffect, useState } from "react";
import { api, Doctor } from "@/lib/api";

export default function Doctors() {
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.doctors().then(setDocs).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Doctors</h1>
      <p className="text-subtext mb-6">Pediatricians and their availability.</p>
      {err && <div className="text-red text-sm">{err}</div>}
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
