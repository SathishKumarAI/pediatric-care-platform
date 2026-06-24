"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Icon } from "./ui";

export function AccountBadge() {
  const { user, ready, logout } = useAuth();
  if (!ready) return null;
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm font-medium text-mauve transition hover:border-mauve/40"
      >
        <Icon name="login" className="h-4 w-4" /> Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-surface0 bg-base px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-text" title={user.email}>{user.email}</div>
        <div className="text-[11px] capitalize text-subtext">{user.role}</div>
      </div>
      <button onClick={logout} className="text-xs font-medium text-red hover:underline">Sign out</button>
    </div>
  );
}
