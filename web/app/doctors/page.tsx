"use client";
import { useCallback, useEffect, useState } from "react";
import { api, Doctor } from "@/lib/api";
import { Badge, Card, Icon, PageHeader } from "../_components/ui";
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

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Doctors" subtitle="Pediatricians, specialties, and availability." />

      {loading && <Loading label="Loading doctors…" />}
      {err && <ErrorBanner message={err} onRetry={load} />}
      {!loading && !err && docs.length === 0 && <EmptyState>No doctors available.</EmptyState>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {docs.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mauve/10 text-mauve">
                <Icon name="doctor" className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-text">{d.name}</div>
                  {d.rating != null && <Badge tone="yellow">★ {d.rating.toFixed(1)}</Badge>}
                </div>
                <div className="text-sm text-mauve">{d.specialty}</div>
                {d.years_experience != null && (
                  <div className="text-xs text-subtext">{d.years_experience} yrs experience</div>
                )}
                {d.bio && <p className="mt-2 text-sm text-subtext">{d.bio}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-subtext">
                  {d.phone && <span>☎ {d.phone}</span>}
                  {d.email && <span>✉ {d.email}</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.available_days.map((day) => (
                    <span key={day} className="rounded-md bg-surface0 px-2 py-0.5 text-xs text-blue">{day}</span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
