"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface AuthState {
  isAuthenticated: boolean;
  phone: string | null;
}

interface AuthCtx {
  state: AuthState;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

const AUTH_KEY = "janarogya-auth";

const DEFAULT_AUTH: AuthState = { isAuthenticated: false, phone: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  // Always start with default state on both server and client to avoid hydration mismatch.
  // Load from localStorage only after mount (client-side).
  const [state, setState] = useState<AuthState>(DEFAULT_AUTH);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as AuthState;
        setState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback(async (phone: string, _otp: string) => {
    // Demo: accept any 10-digit phone + 6-digit OTP
    if (!/^\d{10}$/.test(phone)) throw new Error("Invalid phone");
    const next: AuthState = { isAuthenticated: true, phone };
    setState(next);
    if (typeof window !== "undefined") localStorage.setItem(AUTH_KEY, JSON.stringify(next));
  }, []);

  const logout = useCallback(() => {
    const next: AuthState = { isAuthenticated: false, phone: null };
    setState(next);
    if (typeof window !== "undefined") localStorage.removeItem(AUTH_KEY);
  }, []);

  return <Ctx.Provider value={{ state, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
