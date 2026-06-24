"use client";
import { useEffect, useState } from "react";
import { api, Appointment, Doctor } from "@/lib/api";

const PATIENT = "p1"; // demo patient; real auth wires this in later

export default function Appointments() {
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [start, setStart] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const refresh = () => api.appointments(PATIENT).then(setAppts).catch(() => {});

  useEffect(() => {
    api.doctors().then((d) => { setDocs(d); if (d[0]) setDoctorId(d[0].id); }).catch(() => {});
    refresh();
  }, []);

  async function book() {
    setMsg(null);
    try {
      await api.book(PATIENT, doctorId, new Date(start).toISOString(), reason || undefined);
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
        <button onClick={book} disabled={!doctorId || !start}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40">
          Book appointment
        </button>
        {msg && <div className={`text-sm ${msg.kind === "ok" ? "text-green" : "text-red"}`}>{msg.text}</div>}
      </div>

      <h2 className="font-semibold mb-2">Your appointments</h2>
      {appts.length === 0 && <div className="text-sm text-subtext">None yet.</div>}
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
