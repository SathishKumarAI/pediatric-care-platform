import type { Metadata } from "next";
import Link from "next/link";
import { AccountBadge } from "./_components/AccountBadge";
import { ActivePatient } from "./_components/ActivePatient";
import { Icon } from "./_components/ui";
import { AuthProvider } from "@/lib/auth-context";
import { PatientProvider } from "@/lib/patient-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pediatric Care Platform",
  description: "Pediatric clinical workflows + AI decision support",
};

const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/patients", label: "Children", icon: "child" },
  { href: "/symptom-checker", label: "Symptom Checker", icon: "brain" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
  { href: "/doctors", label: "Doctors", icon: "doctor" },
  { href: "/records", label: "Records", icon: "file" },
  { href: "/stages", label: "Growth Stages", icon: "chart" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PatientProvider>
            <div className="flex min-h-screen">
              {/* Sidebar */}
              <aside className="flex w-64 shrink-0 flex-col border-r border-surface0 bg-mantle">
                <div className="flex items-center gap-2 px-6 py-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mauve text-white">
                    <Icon name="heart" className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-text">PedCare</div>
                    <div className="text-[11px] text-subtext">Care + AI platform</div>
                  </div>
                </div>

                <nav className="flex flex-1 flex-col gap-0.5 px-3">
                  {NAV.map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-subtext transition hover:bg-surface0 hover:text-text"
                    >
                      <Icon name={n.icon} className="h-[18px] w-[18px]" />
                      {n.label}
                    </Link>
                  ))}
                </nav>

                <div className="space-y-2 border-t border-surface0 p-3">
                  <ActivePatient />
                  <AccountBadge />
                </div>
              </aside>

              {/* Main */}
              <div className="flex flex-1 flex-col">
                <header className="flex h-14 items-center justify-between border-b border-surface0 bg-mantle px-8">
                  <span className="text-sm text-subtext">Pediatric Care Platform</span>
                  <span className="rounded-full bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
                    Synthetic data · not a medical device
                  </span>
                </header>
                <main className="flex-1 overflow-y-auto px-8 py-8">
                  <div className="mx-auto max-w-5xl">{children}</div>
                </main>
              </div>
            </div>
          </PatientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
