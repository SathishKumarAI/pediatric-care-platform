import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pediatric Care Platform",
  description: "Pediatric clinical workflows + AI decision support",
};

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/symptom-checker", label: "Symptom Checker" },
  { href: "/appointments", label: "Appointments" },
  { href: "/doctors", label: "Doctors" },
  { href: "/stages", label: "Growth Stages" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 bg-mantle border-r border-surface0 p-5">
            <div className="mb-8">
              <div className="text-lg font-bold text-mauve">🩺 PedCare</div>
              <div className="text-xs text-subtext">Care + AI, merged</div>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-2 text-sm text-subtext hover:bg-surface0 hover:text-text transition-colors"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-8 max-w-4xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
