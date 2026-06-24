"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usePatient } from "@/lib/patient-context";
import { Card, Icon, PageHeader, Stat } from "./_components/ui";

const ACTIONS = [
  { href: "/symptom-checker", title: "Symptom Checker", desc: "AI decision support over a symptom→disease knowledge graph.", icon: "brain" },
  { href: "/appointments", title: "Appointments", desc: "Book and manage visits with conflict detection.", icon: "calendar" },
  { href: "/patients", title: "Children", desc: "Add a child and set the active profile.", icon: "child" },
  { href: "/doctors", title: "Doctors", desc: "Browse pediatricians and availability.", icon: "doctor" },
  { href: "/records", title: "Medical Records", desc: "View and add a patient's clinical notes.", icon: "file" },
  { href: "/stages", title: "Growth Stages", desc: "Developmental milestones and red flags by age.", icon: "chart" },
];

export default function Dashboard() {
  const { selected, patients } = usePatient();
  const { user } = useAuth();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Welcome to PedCare"
        subtitle="Clinical workflows + AI decision support, in one place."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon="heart" label="Backend"
          value={err ? <span className="text-red text-base">offline</span> : <span className="text-green">{health ? "online" : "…"}</span>} />
        <Stat icon="brain" label="Diseases in graph" value={(health?.diseases as number) ?? "—"} />
        <Stat icon="child" label="Children" value={patients.length} href="/patients" />
        <Stat icon="doctor" label="Active child" value={selected ? `${selected.age_months}mo` : "—"} href="/patients" />
      </div>

      {err && (
        <Card className="mb-6 p-4 text-sm text-red">
          Backend unreachable: {err}. Start it with <code className="rounded bg-surface0 px-1">uvicorn app.main:app --reload</code>.
        </Card>
      )}
      {!user && (
        <Card className="mb-6 flex items-center justify-between p-4">
          <span className="text-sm text-subtext">You're browsing as a guest.</span>
          <Link href="/login" className="text-sm font-medium text-mauve hover:underline">Sign in →</Link>
        </Card>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtext">Quick actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href}>
            <Card className="group h-full p-5 transition hover:border-mauve/40">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-mauve/10 text-mauve">
                <Icon name={a.icon} />
              </span>
              <div className="font-semibold text-text group-hover:text-mauve">{a.title}</div>
              <div className="mt-1 text-sm text-subtext">{a.desc}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
