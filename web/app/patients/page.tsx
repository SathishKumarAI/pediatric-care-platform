"use client";
import { useState } from "react";
import { api, Sex } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";

export default function Patients() {
  const { patients, selected, select, refresh, error } = usePatient();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    if (!name.trim() || !birth) return;
    setMsg(null);
    try {
      const p = await api.createPatient({ name: name.trim(), birth_date: birth, sex });
      await refresh();
      select(p.id);
      setName("");
      setBirth("");
      setSex("unknown");
      setMsg(`Added ${p.name} and set as active child.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Children</h1>
      <p className="text-subtext mb-6">Add a child and select who the app is for. The active child drives age and records elsewhere.</p>

      {error && <div className="text-red text-sm mb-4">Backend: {error}</div>}

      <div className="rounded-lg border border-surface0 bg-mantle p-4 mb-6 space-y-3">
        <div className="text-sm font-semibold">Add a child</div>
        <div className="flex gap-3">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-md border border-surface0 bg-base px-3 py-1.5 text-sm" />
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)}
            className="rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm" />
          <select value={sex} onChange={(e) => setSex(e.target.value as Sex)}
            className="rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm">
            <option value="unknown">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button onClick={add} disabled={!name.trim() || !birth}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40">
          Add child
        </button>
        {msg && <div className="text-sm text-green">{msg}</div>}
      </div>

      <h2 className="font-semibold mb-2">Your children</h2>
      {patients.length === 0 ? (
        <div className="text-sm text-subtext">None yet. Add one above.</div>
      ) : (
        <div className="space-y-2">
          {patients.map((p) => {
            const active = selected?.id === p.id;
            return (
              <div key={p.id}
                className={`flex items-center justify-between rounded-lg border bg-mantle p-3 ${active ? "border-mauve" : "border-surface0"}`}>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-subtext">{p.age_months} months · {p.sex}</div>
                </div>
                <button onClick={() => select(p.id)} disabled={active}
                  className={`rounded-md px-3 py-1 text-xs ${active ? "bg-surface0 text-green" : "bg-mauve text-crust"}`}>
                  {active ? "✓ Active" : "Select"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
