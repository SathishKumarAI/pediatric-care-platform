"use client";
import Link from "next/link";
import { usePatient } from "@/lib/patient-context";

export function ActivePatient() {
  const { selected } = usePatient();
  return (
    <Link
      href="/patients"
      className="mt-6 block rounded-md border border-surface0 bg-base px-3 py-2 text-xs hover:border-mauve transition-colors"
    >
      <div className="text-subtext">Active child</div>
      {selected ? (
        <div className="text-text font-medium">
          {selected.name} · {selected.age_months}mo
        </div>
      ) : (
        <div className="text-peach">None — pick one</div>
      )}
    </Link>
  );
}
