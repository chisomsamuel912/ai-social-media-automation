"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { user, signUp, signIn, signInGoogle, signInGuest, signOut } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!email.includes("@") || password.length < 6) {
      setMsg("Enter a valid email and a 6+ character password.");
      return;
    }
    setBusy(true);
    setMsg(mode === "up" ? "Creating account…" : "Signing in…");
    const err = mode === "up" ? await signUp(email, password) : await signIn(email, password);
    setMsg(err ?? (mode === "up" ? "Check your email to confirm, then sign in." : ""));
    if (!err && mode === "in") window.location.href = "/";
    setBusy(false);
  }

  async function google() {
    const err = await signInGoogle();
    if (err) setMsg(err.includes("provider") || err.includes("OAuth") ? "Google isn't enabled yet — use email for now." : err);
  }

  async function guest() {
    setBusy(true);
    setMsg("Getting you in…");
    const err = await signInGuest();
    if (err) {
      setMsg(err.includes("Anonymous") || err.includes("anonymous")
        ? "Guest mode isn't switched on yet — use email for now."
        : err);
    } else {
      window.location.href = "/";
    }
    setBusy(false);
  }

  return (
    <main className="stage flex items-center justify-center px-4 py-14">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#5EEAD4" }} />
      <div className="orb orb-b" style={{ width: 440, height: 440, right: "-130px", bottom: "-140px", background: "#F2C078" }} />
      <div className="glass relative w-full max-w-md p-8">
        {user ? (
          <div className="text-center">
            <h1 className="grad-text text-3xl">You&apos;re signed in</h1>
            <p className="mt-2 text-sm text-muted">{user.email}</p>
            <div className="mt-6 flex justify-center gap-2">
              <a href="/onboarding" className="btn-primary">Continue setup →</a>
              <button onClick={signOut} className="btn-ghost">Sign out</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">
              {mode === "up" ? "Create your account" : "Welcome back"}
            </p>
            <h1 className="grad-text mt-1 text-center text-4xl">{mode === "up" ? "Sign up" : "Log in"}</h1>
            <div className="mt-6 grid gap-3">
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
              <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (6+ characters)" onKeyDown={(e) => e.key === "Enter" && go()} />
              <button onClick={go} disabled={busy} className="btn-primary w-full">
                {busy ? "…" : mode === "up" ? "Create account" : "Log in"}
              </button>
              <button onClick={google} className="btn-ghost w-full">Continue with Google</button>
              <button onClick={guest} disabled={busy} className="btn-ghost w-full">⚡ Continue as guest (no email)</button>
            </div>
            {msg && <p className="mt-3 text-center text-sm text-muted">{msg}</p>}
            <p className="mt-4 text-center text-sm text-muted">
              {mode === "up" ? "Already have an account?" : "New here?"}{" "}
              <button onClick={() => { setMode(mode === "up" ? "in" : "up"); setMsg(""); }} className="underline">
                {mode === "up" ? "Log in" : "Sign up"}
              </button>
            </p>
            <p className="mt-2 text-center text-sm">
              <a href="/onboarding" className="font-semibold underline">New here? Set up your business to begin →</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
