"use client";
import { useState } from "react";
import { PatientInput, Sex } from "@/lib/api";
import { api } from "@/lib/api";
import { usePatient } from "@/lib/patient-context";
import { Badge, Button, Card, EmptyStateUI, PageHeader } from "../_components/ui";
import { ErrorBanner } from "../_components/States";

const BLANK: PatientInput = {
  name: "", last_name: "", birth_date: "", sex: "unknown",
  blood_type: "", guardian_name: "", guardian_phone: "", email: "", phone: "",
  allergies: "", notes: "",
};

export default function Patients() {
  const { patients, selected, select, refresh, error } = usePatient();
  const [form, setForm] = useState<PatientInput>(BLANK);
  const [touched, setTouched] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const nameErr = !form.name.trim() ? "Name is required" : "";
  const birthErr = !form.birth_date ? "Birth date is required"
    : form.birth_date > today ? "Birth date can't be in the future" : "";
  const valid = !nameErr && !birthErr;

  const set = (k: keyof PatientInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function add() {
    setTouched(true);
    if (!valid) return;
    setMsg(null);
    try {
      // strip empty optionals
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ""),
      ) as unknown as PatientInput;
      const p = await api.createPatient(payload);
      await refresh();
      select(p.id);
      setForm(BLANK);
      setTouched(false);
      setOpen(false);
      setMsg(`Added ${p.name} and set as active child.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Children"
        subtitle="Add a child profile. The active child drives age, records, and bookings elsewhere."
        action={<Button onClick={() => setOpen((o) => !o)}>{open ? "Close" : "+ Add child"}</Button>}
      />

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={refresh} /></div>}
      {msg && <Card className="mb-4 p-3 text-sm text-green">{msg}</Card>}

      {open && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-text">New child</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First name *" error={touched ? nameErr : ""}>
              <input aria-label="First name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls(touched && !!nameErr)} />
            </Field>
            <Field label="Last name">
              <input aria-label="Last name" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Birth date *" error={touched ? birthErr : ""}>
              <input aria-label="Birth date" type="date" max={today} value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} className={inputCls(touched && !!birthErr)} />
            </Field>
            <Field label="Sex">
              <select aria-label="Sex" value={form.sex} onChange={(e) => set("sex", e.target.value as Sex)} className={inputCls(false)}>
                <option value="unknown">—</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Blood type">
              <input aria-label="Blood type" placeholder="e.g. O+" value={form.blood_type} onChange={(e) => set("blood_type", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Allergies">
              <input aria-label="Allergies" placeholder="e.g. penicillin" value={form.allergies} onChange={(e) => set("allergies", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Guardian name">
              <input aria-label="Guardian name" value={form.guardian_name} onChange={(e) => set("guardian_name", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Guardian phone">
              <input aria-label="Guardian phone" value={form.guardian_phone} onChange={(e) => set("guardian_phone", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Email">
              <input aria-label="Email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls(false)} />
            </Field>
            <Field label="Phone">
              <input aria-label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls(false)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea aria-label="Notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls(false)} />
              </Field>
            </div>
          </div>
          <div className="mt-4"><Button onClick={add}>Save child</Button></div>
        </Card>
      )}

      {patients.length === 0 ? (
        <EmptyStateUI>No children yet. Click “Add child” to create one.</EmptyStateUI>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {patients.map((p) => {
            const active = selected?.id === p.id;
            return (
              <Card key={p.id} className={`p-4 ${active ? "border-mauve" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-text">{p.name} {p.last_name}</div>
                    <div className="text-xs text-subtext">{p.age_months} months · {p.sex}{p.blood_type ? ` · ${p.blood_type}` : ""}</div>
                  </div>
                  {active ? <Badge tone="green">Active</Badge>
                    : <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => select(p.id)}>Select</Button>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {p.guardian_name && <Row k="Guardian" v={p.guardian_name} />}
                  {p.guardian_phone && <Row k="Guardian ☎" v={p.guardian_phone} />}
                  {p.allergies && <Row k="Allergies" v={p.allergies} />}
                  {p.email && <Row k="Email" v={p.email} />}
                  {p.phone && <Row k="Phone" v={p.phone} />}
                </dl>
                {p.notes && <p className="mt-2 text-xs text-subtext">{p.notes}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function inputCls(err: boolean) {
  return `w-full rounded-lg border bg-mantle px-3 py-2 text-sm ${err ? "border-red" : "border-surface1"}`;
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-subtext">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red">{error}</span>}
    </label>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (<><dt className="text-subtext">{k}</dt><dd className="truncate text-text">{v}</dd></>);
}
