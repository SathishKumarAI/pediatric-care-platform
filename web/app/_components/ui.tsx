"use client";
import Link from "next/link";

/* ---- Icons (inline SVG, no dependency) ---- */
const PATHS: Record<string, string> = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  child: "M12 2a3 3 0 110 6 3 3 0 010-6zm-7 9a7 7 0 0114 0v1H5v-1zm3 4h8l-1 7H9l-1-7z",
  brain: "M9 2a3 3 0 00-3 3v.5A3.5 3.5 0 003 9a3.5 3.5 0 002 3.16V14a3 3 0 003 3h1V2H9zm6 0a3 3 0 013 3v.5A3.5 3.5 0 0121 9a3.5 3.5 0 01-2 3.16V14a3 3 0 01-3 3h-1V2h1z",
  calendar: "M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zM5 9h14v10H5V9z",
  doctor: "M12 2a4 4 0 100 8 4 4 0 000-8zM6 22v-2a4 4 0 014-4h4a4 4 0 014 4v2h-2v-2a2 2 0 00-2-2h-1v3h-2v-3h-1a2 2 0 00-2 2v2H6z",
  file: "M6 2h8l6 6v14H6V2zm7 1.5V8h4.5L13 3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z",
  chart: "M4 20V4h2v14h14v2H4zm4-3l4-5 3 3 5-6 1.4 1.3L15 18l-3-3-3.5 4.5L8 17z",
  login: "M10 17v-2H4V9h6V7l5 5-5 5zm2-15h7a2 2 0 012 2v16a2 2 0 01-2 2h-7v-2h7V4h-7V2z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z",
  heart: "M12 21s-7-4.6-9.3-9C1.2 9 2.4 5.5 5.5 5.5c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2 3.1 0 4.3 3.5 2.8 6.5C19 16.4 12 21 12 21z",
};

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.dashboard} />
    </svg>
  );
}

/* ---- Surfaces ---- */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-surface0 bg-mantle shadow-card ${className}`}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-subtext">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---- Buttons ---- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };
export function Button({ variant = "primary", className = "", ...props }: BtnProps) {
  const styles = {
    primary: "bg-mauve text-white hover:opacity-90",
    ghost: "border border-surface1 text-text hover:bg-surface0",
    danger: "border border-red/40 text-red hover:bg-red/5",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

/* ---- Bits ---- */
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "yellow" | "red" | "blue" }) {
  const tones = {
    neutral: "bg-surface0 text-subtext",
    green: "bg-green/10 text-green",
    yellow: "bg-yellow/10 text-yellow",
    red: "bg-red/10 text-red",
    blue: "bg-blue/10 text-blue",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones}`}>{children}</span>;
}

export function EmptyStateUI({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-dashed px-4 py-10 text-center text-sm text-subtext">{children}</Card>
  );
}

export function Stat({ label, value, icon, href }: { label: string; value: React.ReactNode; icon: string; href?: string }) {
  const inner = (
    <Card className="flex items-center gap-4 p-4 transition hover:border-mauve/40">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-mauve/10 text-mauve">
        <Icon name={icon} />
      </span>
      <div>
        <div className="text-xl font-semibold text-text">{value}</div>
        <div className="text-xs text-subtext">{label}</div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
