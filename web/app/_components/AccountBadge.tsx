"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AccountBadge() {
  const { user, ready, logout } = useAuth();
  if (!ready) return null;
  return (
    <div className="mt-3 rounded-md border border-surface0 bg-base px-3 py-2 text-xs">
      {user ? (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-text" title={user.email}>{user.email}</span>
          <button onClick={logout} className="text-red hover:underline">out</button>
        </div>
      ) : (
        <Link href="/login" className="text-blue hover:underline">Sign in</Link>
      )}
    </div>
  );
}
