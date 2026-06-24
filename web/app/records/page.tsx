"use client";
import { useEffect, useState } from "react";
import { api, MedicalRecord } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import { EmptyState } from "../_components/States";

export default function Records() {
  const { selected } = usePatient();
  const [subject, setSubject] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(s: string) {
    if (!s.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const recs = await api.records(s.trim());
      setRecords(recs);
      setLoaded(s.trim());
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }

  // Default the subject to the active child on first load.
  useEffect(() => {
    if (selected && !loaded) {
      setSubject(selected.id);
      load(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function add() {
    if (!loaded || !note.trim()) return;
    setMsg(null);
    try {
      await api.addRecord({
        id: crypto.randomUUID(),
        subject: loaded,
        recorded: new Date().toISOString(),
        note: note.trim(),
        attachments: attachments
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
      setNote("");
      setAttachments("");
      setMsg({ kind: "ok", text: "Record added." });
      load(loaded);
    } catch (e) {
      setMsg({ kind: "err", text: (e as Error).message });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Medical Records</h1>
      <p className="text-subtext mb-6">Append-only notes for a patient. Enter a patient ID to view or add records.</p>

      <div className="flex gap-3 mb-6">
        <input
          placeholder="Patient ID (e.g. p1)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(subject)}
          className="flex-1 rounded-md border border-surface0 bg-mantle px-3 py-1.5 text-sm"
        />
        <button
          onClick={() => load(subject)}
          disabled={!subject.trim() || loading}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 text-sm ${msg.kind === "ok" ? "text-green" : "text-red"}`}>{msg.text}</div>
      )}

      {loaded && (
        <>
          <div className="rounded-lg border border-surface0 bg-mantle p-4 mb-6 space-y-3">
            <div className="text-sm font-semibold">Add a record for {loaded}</div>
            <textarea
              placeholder="Clinical note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-surface0 bg-base px-3 py-2 text-sm"
            />
            <input
              placeholder="Attachment refs (comma-separated, optional)"
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full rounded-md border border-surface0 bg-base px-3 py-1.5 text-sm"
            />
            <button
              onClick={add}
              disabled={!note.trim()}
              className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40"
            >
              Add record
            </button>
          </div>

          <h2 className="font-semibold mb-2">History for {loaded}</h2>
          {records.length === 0 ? (
            <EmptyState>No records yet for this patient.</EmptyState>
          ) : (
            <div className="space-y-2">
              {records
                .slice()
                .sort((a, b) => b.recorded.localeCompare(a.recorded))
                .map((r) => (
                  <div key={r.id} className="rounded-lg border border-surface0 bg-mantle p-3">
                    <div className="text-xs text-subtext">{new Date(r.recorded).toLocaleString()}</div>
                    <div className="text-sm mt-1">{r.note}</div>
                    {r.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.attachments.map((a) => (
                          <span key={a} className="rounded bg-surface0 px-2 py-0.5 text-xs text-blue">📎 {a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
