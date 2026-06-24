"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const CARDS = [
  { href: "/patients", title: "Children", desc: "Add a child and set the active profile.", emoji: "🧒" },
  { href: "/symptom-checker", title: "Symptom Checker", desc: "AI decision support over a symptom→disease knowledge graph.", emoji: "🧠" },
  { href: "/appointments", title: "Appointments", desc: "Book and view visits with conflict detection.", emoji: "📅" },
  { href: "/doctors", title: "Doctors", desc: "Browse pediatricians and availability.", emoji: "👩‍⚕️" },
  { href: "/records", title: "Medical Records", desc: "View and add a patient's clinical notes.", emoji: "📋" },
  { href: "/stages", title: "Growth Stages", desc: "Developmental milestones and red flags by age.", emoji: "📈" },
];

export default function Dashboard() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pediatric Care Platform</h1>
      <p className="text-subtext mb-6">
        Clinical workflows from <em>Pediatrics</em> + AI/knowledge-graph from{" "}
        <em>Medical-Research</em>, merged into one desktop app.
      </p>

      <div className="mb-6 rounded-lg border border-surface0 bg-mantle px-4 py-3 text-sm">
        {err ? (
          <span className="text-red">Backend unreachable: {err} — start it with <code>uvicorn app.main:app --reload</code></span>
        ) : health ? (
          <span className="text-green">
            ● Backend {String(health.status)} · provider {String(health.provider)} · {String(health.diseases)} diseases in graph
          </span>
        ) : (
          <span className="text-subtext">Checking backend…</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href}
            className="rounded-lg border border-surface0 bg-mantle p-5 hover:border-mauve transition-colors">
            <div className="text-2xl mb-2">{c.emoji}</div>
            <div className="font-semibold mb-1">{c.title}</div>
            <div className="text-sm text-subtext">{c.desc}</div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-subtext">
        ⚠️ Decision-support prototype on synthetic data. Not a medical device, not for real diagnosis.
      </p>
    </div>
  );
}
