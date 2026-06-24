"use client";
import { Milestone } from "@/lib/api";

const DOMAIN_COLOR: Record<string, string> = {
  motor: "var(--color-blue)",
  language: "var(--color-mauve)",
  social: "var(--color-green)",
  cognitive: "var(--color-yellow)",
};

// Lightweight SVG timeline of milestones by age, with a marker at the child's
// current age. No chart library — keeps the desktop bundle small (PCP-11).
export function MilestoneTimeline({
  milestones,
  currentAge,
}: {
  milestones: Milestone[];
  currentAge: number;
}) {
  const maxAge = Math.max(60, currentAge, ...milestones.map((m) => m.age_months));
  const x = (age: number) => (age / maxAge) * 100;
  const domains = Array.from(new Set(milestones.map((m) => m.domain)));

  return (
    <div>
      <svg viewBox="0 0 100 22" className="w-full" role="img" aria-label="Milestone timeline by age">
        {/* axis */}
        <line x1="0" y1="18" x2="100" y2="18" stroke="var(--color-surface1)" strokeWidth="0.3" />
        {/* current-age marker */}
        <line x1={x(currentAge)} y1="2" x2={x(currentAge)} y2="18"
          stroke="var(--color-peach)" strokeWidth="0.4" strokeDasharray="1 1" />
        {milestones.map((m, i) => (
          <circle key={i} cx={x(m.age_months)} cy={4 + (domains.indexOf(m.domain) % 4) * 3.2}
            r="1.1" fill={DOMAIN_COLOR[m.domain] ?? "var(--color-text)"}>
            <title>{`${m.age_months}mo · ${m.domain}: ${m.milestone}`}</title>
          </circle>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={f * 100} y="21.5" fontSize="1.6" fill="var(--color-subtext)"
            textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}>
            {Math.round(f * maxAge)}mo
          </text>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-xs">
        {domains.map((d) => (
          <span key={d} className="flex items-center gap-1 text-subtext">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: DOMAIN_COLOR[d] }} />
            {d}
          </span>
        ))}
        <span className="flex items-center gap-1 text-peach">┊ now ({currentAge}mo)</span>
      </div>
    </div>
  );
}
