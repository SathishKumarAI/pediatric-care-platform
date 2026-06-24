"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const { login, signup, user, logout } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") await signup(email, password);
      else await login(email, password);
      router.push("/");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Account</h1>
        <p className="text-subtext mb-4">Signed in as <span className="text-text">{user.email}</span> ({user.role}).</p>
        <button onClick={logout} className="rounded-md border border-red/50 px-4 py-1.5 text-sm text-red hover:bg-surface0">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-bold mb-1">{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="text-subtext mb-6">Accounts identify who is using the app. (RBAC enforcement is upcoming.)</p>

      <div className="space-y-3">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-surface0 bg-mantle px-3 py-2 text-sm" />
        <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full rounded-md border border-surface0 bg-mantle px-3 py-2 text-sm" />
        {err && <div role="alert" className="text-sm text-red">{err}</div>}
        <button onClick={submit} disabled={busy || !email || password.length < 6}
          className="w-full rounded-md bg-mauve px-4 py-2 text-sm font-medium text-crust disabled:opacity-40">
          {busy ? "…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </div>

      <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); }}
        className="mt-4 text-sm text-blue hover:underline">
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
