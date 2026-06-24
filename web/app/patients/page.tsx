"use client";
import { useState } from "react";
import { api, Sex } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import { EmptyState, ErrorBanner } from "../_components/States";

export default function Patients() {
  const { patients, selected, select, refresh, error } = usePatient();
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [msg, setMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const nameErr = !name.trim() ? "Name is required" : "";
  const birthErr = !birth
    ? "Birth date is required"
    : birth > today
      ? "Birth date can't be in the future"
      : "";
  const valid = !nameErr && !birthErr;

  async function add() {
    setTouched(true);
    if (!valid) return;
    setMsg(null);
    try {
      const p = await api.createPatient({ name: name.trim(), birth_date: birth, sex });
      await refresh();
      select(p.id);
      setName("");
      setBirth("");
      setSex("unknown");
      setTouched(false);
      setMsg(`Added ${p.name} and set as active child.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Children</h1>
      <p className="text-subtext mb-6">Add a child and select who the app is for. The active child drives age and records elsewhere.</p>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={refresh} /></div>}

      <div className="rounded-lg border border-surface0 bg-mantle p-4 mb-6 space-y-3">
        <div className="text-sm font-semibold">Add a child</div>
        <div className="flex gap-3">
          <div className="flex-1">
            <input aria-label="Name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
              aria-invalid={touched && !!nameErr}
              className={`w-full rounded-md border bg-base px-3 py-1.5 text-sm ${touched && nameErr ? "border-red" : "border-surface0"}`} />
            {touched && nameErr && <p className="mt-1 text-xs text-red">{nameErr}</p>}
          </div>
          <div>
            <input aria-label="Birth date" type="date" max={today} value={birth} onChange={(e) => setBirth(e.target.value)}
              aria-invalid={touched && !!birthErr}
              className={`rounded-md border bg-base px-2 py-1.5 text-sm ${touched && birthErr ? "border-red" : "border-surface0"}`} />
            {touched && birthErr && <p className="mt-1 text-xs text-red">{birthErr}</p>}
          </div>
          <select aria-label="Sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}
            className="h-fit rounded-md border border-surface0 bg-base px-2 py-1.5 text-sm">
            <option value="unknown">—</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button onClick={add}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust">
          Add child
        </button>
        {msg && <div className="text-sm text-green">{msg}</div>}
      </div>

      <h2 className="font-semibold mb-2">Your children</h2>
      {patients.length === 0 ? (
        <EmptyState>No children yet. Add one above.</EmptyState>
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
