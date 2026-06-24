"use client";
import Link from "next/link";
import { usePatient } from "@/lib/patient-context";
import { Icon } from "./ui";

export function ActivePatient() {
  const { selected } = usePatient();
  return (
    <Link
      href="/patients"
      className="flex items-center gap-3 rounded-lg border border-surface0 bg-base px-3 py-2 transition hover:border-mauve/40"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mauve/10 text-mauve">
        <Icon name="child" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-subtext">Active child</div>
        {selected ? (
          <div className="truncate text-sm font-medium text-text">{selected.name} · {selected.age_months}mo</div>
        ) : (
          <div className="text-sm font-medium text-peach">None — pick one</div>
        )}
      </div>
    </Link>
  );
}
