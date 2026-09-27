"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase-browser";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInGoogle: () => Promise<string | null>;
  signInGuest: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  signUp: async () => "unavailable",
  signIn: async () => "unavailable",
  signInGoogle: async () => "unavailable",
  signInGuest: async () => "unavailable",
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = getBrowserClient();
    if (!db) {
      setReady(true);
      return;
    }
    db.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = db.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp(email: string, password: string): Promise<string | null> {
    const db = getBrowserClient();
    if (!db) return "Supabase keys missing.";
    const { error } = await db.auth.signUp({ email, password });
    return error ? error.message : null;
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    const db = getBrowserClient();
    if (!db) return "Supabase keys missing.";
    const { error } = await db.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }

  async function signInGoogle(): Promise<string | null> {
    const db = getBrowserClient();
    if (!db) return "Supabase keys missing.";
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined }
    });
    return error ? error.message : null;
  }

  async function signOut(): Promise<void> {
    await getBrowserClient()?.auth.signOut();
    setUser(null);
  }

  /** One-tap guest entry, no email. Needs Anonymous provider enabled in Supabase dashboard. */
  async function signInGuest(): Promise<string | null> {
    const db = getBrowserClient();
    if (!db) return "Supabase keys missing.";
    const { error } = await db.auth.signInAnonymously();
    return error ? error.message : null;
  }

  return <Ctx.Provider value={{ user, ready, signUp, signIn, signInGoogle, signInGuest, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
