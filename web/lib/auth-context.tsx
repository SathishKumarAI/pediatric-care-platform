"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api, TOKEN_KEY, UserPublic } from "./api";

interface AuthCtx {
  user: UserPublic | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: UserPublic["role"]) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setReady(true));
  }, []);

  async function finishAuth(p: Promise<{ token: string; user: UserPublic }>) {
    const { token, user } = await p;
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
  }

  const login = (email: string, password: string) => finishAuth(api.login(email, password));
  const signup = (email: string, password: string, role?: UserPublic["role"]) =>
    finishAuth(api.signup(email, password, role));

  function logout() {
    api.logout().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, ready, login, signup, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
