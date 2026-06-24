"use client";
import { useEffect, useState } from "react";
import { api, SymptomResponse, Triage } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";

const COMMON = [
  "fever", "cough", "sore throat", "ear pain", "runny nose", "vomiting",
  "diarrhea", "headache", "rash", "difficulty breathing", "wheezing", "red eyes",
];

const TRIAGE_STYLE: Record<Triage, string> = {
  "self-care": "text-green border-green",
  "see-doctor": "text-yellow border-yellow",
  urgent: "text-red border-red",
};

export default function SymptomChecker() {
  const { selected: activeChild } = usePatient();
  const [selected, setSelected] = useState<string[]>([]);
  const [age, setAge] = useState<string>("");
  const [result, setResult] = useState<SymptomResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill age from the active child when one is selected and age is blank.
  useEffect(() => {
    if (activeChild && age === "") setAge(String(activeChild.age_months));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild]);

  const toggle = (s: string) =>
    setSelected((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const [saved, setSaved] = useState<string | null>(null);

  async function run() {
    setLoading(true); setErr(null); setResult(null); setSaved(null);
    try {
      const r = await api.predict(selected, age ? Number(age) : undefined);
      setResult(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function saveToRecord() {
    if (!activeChild || !result) return;
    const top = result.predictions
      .map((p) => `${p.disease.replace(/_/g, " ")} ${(p.confidence * 100).toFixed(0)}%`)
      .join(", ");
    const note =
      `Symptom check — triage: ${result.triage}. ` +
      `Symptoms: ${selected.join(", ") || "none"}. ` +
      `Top: ${top || "none"}.`;
    try {
      await api.addRecord({
        id: crypto.randomUUID(),
        subject: activeChild.id,
        recorded: new Date().toISOString(),
        note,
        attachments: [],
      });
      setSaved(`Saved to ${activeChild.name}'s record.`);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Symptom Checker</h1>
      <p className="text-subtext mb-6">Select symptoms → ranked conditions, triage, and a plain-language explanation.</p>

      <div role="group" aria-label="Symptoms" className="flex flex-wrap gap-2 mb-4">
        {COMMON.map((s) => (
          <button key={s} onClick={() => toggle(s)} aria-pressed={selected.includes(s)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              selected.includes(s)
                ? "border-mauve bg-surface0 text-text"
                : "border-surface0 text-subtext hover:text-text"
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="age-months" className="text-sm text-subtext">Age (months):</label>
        <input id="age-months" type="number" value={age} onChange={(e) => setAge(e.target.value)}
          className="w-24 rounded-md border border-surface0 bg-mantle px-2 py-1 text-sm" />
        <button onClick={run} disabled={!selected.length || loading}
          className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust disabled:opacity-40">
          {loading ? "Analyzing…" : "Check symptoms"}
        </button>
      </div>

      {err && <div role="alert" className="text-red text-sm mb-4">{err}</div>}

      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className={`inline-block rounded-md border px-3 py-1 text-sm font-medium ${TRIAGE_STYLE[result.triage]}`}>
            Triage: {result.triage}
          </div>
          <div className="space-y-2">
            {result.predictions.map((p) => (
              <div key={p.disease} className="rounded-lg border border-surface0 bg-mantle p-3">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">{p.disease.replace(/_/g, " ")}</span>
                  <span className="text-blue">{(p.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded bg-surface0">
                  <div className="h-1.5 rounded bg-blue" style={{ width: `${p.confidence * 100}%` }} />
                </div>
                <div className="mt-1 text-xs text-subtext">matched: {p.matched_symptoms.join(", ")}</div>
              </div>
            ))}
          </div>
          {result.explanation && (
            <div className="rounded-lg border border-surface0 bg-mantle p-3 text-sm text-subtext">{result.explanation}</div>
          )}
          <div className="text-xs text-peach">{result.disclaimer}</div>

          {activeChild && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveToRecord}
                disabled={!!saved}
                className="rounded-md border border-mauve px-3 py-1.5 text-sm text-mauve hover:bg-surface0 disabled:opacity-40"
              >
                {saved ? "✓ Saved" : `Save to ${activeChild.name}'s record`}
              </button>
              {saved && <span className="text-sm text-green">{saved}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
