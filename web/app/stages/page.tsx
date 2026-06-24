"use client";
import { useEffect, useState } from "react";
import { api, StageResponse } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import { MilestoneTimeline } from "../_components/MilestoneTimeline";

export default function Stages() {
  const { selected } = usePatient();
  const [age, setAge] = useState("12");
  const [data, setData] = useState<StageResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (selected) setAge(String(selected.age_months));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  async function load() {
    setErr(null);
    try {
      setData(await api.stages(Number(age)));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Growth Stages</h1>
      <p className="text-subtext mb-6">Developmental milestones and red flags by age (from Medical-Research data).</p>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-subtext">Age (months):</label>
        <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
          className="w-24 rounded-md border border-surface0 bg-mantle px-2 py-1 text-sm" />
        <button onClick={load} className="rounded-md bg-mauve px-4 py-1.5 text-sm font-medium text-crust">View</button>
      </div>

      {err && <div className="text-red text-sm">{err}</div>}

      {data && (
        <div className="space-y-5">
          <div className="text-lg">Stage: <span className="text-mauve font-semibold">{data.stage}</span></div>
          <div className="rounded-lg border border-surface0 bg-mantle p-4">
            <h2 className="font-semibold mb-2">Milestone timeline</h2>
            <MilestoneTimeline milestones={data.expected} currentAge={data.age_months} />
          </div>
          <div>
            <h2 className="font-semibold mb-2">Expected milestones</h2>
            <div className="space-y-1">
              {data.expected.map((m, i) => (
                <div key={i} className="flex gap-3 rounded border border-surface0 bg-mantle px-3 py-2 text-sm">
                  <span className="w-16 text-subtext">{m.age_months}mo</span>
                  <span className="w-24 text-blue">{m.domain}</span>
                  <span>{m.milestone}</span>
                </div>
              ))}
            </div>
          </div>
          {data.red_flags.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2 text-red">Red flags — discuss with a pediatrician</h2>
              <ul className="list-disc pl-5 text-sm text-peach space-y-1">
                {data.red_flags.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
