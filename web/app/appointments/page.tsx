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

  const startInPast = !!start && new Date(start).getTime() < Date.now();

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

  async function cancel(id: string) {
    setMsg(null);
    try {
      await api.patchAppointment(id, { status: "cancelled" });
      refresh();
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    }
  }

  async function reschedule(id: string) {
    const next = window.prompt("New date & time (YYYY-MM-DDTHH:MM):");
    if (!next) return;
    const when = new Date(next);
    if (isNaN(when.getTime())) {
      setMsg({ kind: "err", text: "Couldn't parse that date/time." });
      return;
    }
    setMsg(null);
    try {
      await api.patchAppointment(id, { start: when.toISOString() });
      setMsg({ kind: "ok", text: "Appointment rescheduled." });
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
          <div>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
              aria-invalid={startInPast}
              className={`rounded-md border bg-base px-2 py-1.5 text-sm ${startInPast ? "border-red" : "border-surface0"}`} />
          </div>
        </div>
        {startInPast && <p className="text-xs text-red">Pick a time in the future.</p>}
        <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm" />
        <button onClick={book} disabled={!doctorId || !start || !selected || startInPast}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40">
          Book appointment
        </button>
        {msg && <div className={`text-sm ${msg.kind === "ok" ? "text-green" : "text-red"}`}>{msg.text}</div>}
      </div>

      <h2 className="font-semibold mb-2">Your appointments</h2>
      {appts.length === 0 && <EmptyState>No appointments yet.</EmptyState>}
      <div className="space-y-2">
        {appts.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-surface0 bg-mantle p-3 text-sm">
            <span className={a.status === "cancelled" ? "text-subtext line-through" : ""}>
              {new Date(a.start).toLocaleString()} · {docs.find((d) => d.id === a.doctor_id)?.name ?? a.doctor_id}
            </span>
            <span className="flex items-center gap-2">
              <span className={a.status === "cancelled" ? "text-red" : "text-green"}>{a.status}</span>
              {a.status === "booked" && (
                <>
                  <button onClick={() => reschedule(a.id)}
                    className="rounded border border-surface1 px-2 py-0.5 text-xs text-subtext hover:text-text">
                    Reschedule
                  </button>
                  <button onClick={() => cancel(a.id)}
                    className="rounded border border-red/50 px-2 py-0.5 text-xs text-red hover:bg-surface0">
                    Cancel
                  </button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
