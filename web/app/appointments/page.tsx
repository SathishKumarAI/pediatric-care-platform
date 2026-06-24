"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, Appointment, Doctor } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import { EmptyState } from "../_components/States";

export default function Appointments() {
  const { selected } = usePatient();
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [start, setStart] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const refresh = useCallback(() => {
    if (selected) api.appointments(selected.id).then(setAppts).catch(() => {});
    else setAppts([]);
  }, [selected]);

  useEffect(() => {
    api.doctors().then((d) => { setDocs(d); if (d[0]) setDoctorId(d[0].id); }).catch(() => {});
    refresh();
  }, [refresh]);

  async function book() {
    if (!selected) return;
    setMsg(null);
    try {
      await api.book(selected.id, doctorId, new Date(start).toISOString(), reason || undefined);
      setMsg({ kind: "ok", text: "Appointment booked." });
      setReason("");
      refresh();
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Appointments</h1>
      <p className="text-subtext mb-6">Book a visit — the backend rejects double-booked slots (409).</p>

      {!selected && (
        <div className="mb-6 rounded-lg border border-peach/40 bg-mantle px-4 py-3 text-sm text-peach">
          No active child. <Link href="/patients" className="underline">Pick one</Link> to book for them.
        </div>
      )}

      {selected && <div className="mb-3 text-sm text-subtext">Booking for <span className="text-text font-medium">{selected.name}</span></div>}

      <div className="rounded-lg border border-surface0 bg-mantle p-4 mb-6 space-y-3">
        <div className="flex gap-3">
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
            className="rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm flex-1">
            {docs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
            className="rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm" />
        </div>
        <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm" />
        <button onClick={book} disabled={!doctorId || !start || !selected}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40">
          Book appointment
        </button>
        {msg && <div className={`text-sm ${msg.kind === "ok" ? "text-green" : "text-red"}`}>{msg.text}</div>}
      </div>

      <h2 className="font-semibold mb-2">Your appointments</h2>
      {appts.length === 0 && <EmptyState>No appointments yet.</EmptyState>}
      <div className="space-y-2">
        {appts.map((a) => (
          <div key={a.id} className="flex justify-between rounded-lg border border-surface0 bg-mantle p-3 text-sm">
            <span>{new Date(a.start).toLocaleString()} · {docs.find((d) => d.id === a.doctor_id)?.name ?? a.doctor_id}</span>
            <span className="text-green">{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
