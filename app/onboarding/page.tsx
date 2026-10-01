"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const TONES = ["Friendly and simple", "Professional", "Playful", "Bold"];
const PLATFORMS = [
  { id: "instagram", label: "📸 Instagram" },
  { id: "facebook", label: "📘 Facebook" },
  { id: "whatsapp", label: "💬 WhatsApp" }
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [sells, setSells] = useState("");
  const [customers, setCustomers] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [topics, setTopics] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      window.location.href = "/review";
    }, 4000);
    return () => clearTimeout(t);
  }, [done]);

  function togglePlatform(id: string) {
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function submit() {
    if (name.trim().length < 2 || sells.trim().length < 3) {
      setStatus("Just two things to start: your business name and what you sell.");
      return;
    }
    if (platforms.length === 0) {
      setStatus("Pick at least one platform.");
      return;
    }
    setBusy(true);
    setStatus("Saving…");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sells: sells.trim(),
          customers: customers.trim(),
          tone,
          topics: topics.trim(),
          platforms,
          ownerId: user?.id
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(body.error === "supabase-not-configured"
          ? "Database isn't connected yet — try again in a minute."
          : `Something went wrong (${body.error ?? res.status}). Try again.`);
        setBusy(false);
        return;
      }
      try {
        localStorage.setItem("business-id", body.businessId);
      } catch {}
      // The AI starts working immediately — no buttons needed.
      setStatus("Got it — I'm making your first posts now…");
      fetch("/api/cron/dispatch").catch(() => {});
      setDone(true);
    } catch {
      setStatus("Couldn't reach the server. Check your connection and retry.");
    }
    setBusy(false);
  }

  if (done) {
    return (
      <main className="stage flex items-center justify-center px-4 py-14">
        <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
        <div className="orb orb-b" style={{ width: 480, height: 480, right: "-140px", bottom: "-160px", background: "#D9CFC0" }} />
        <div className="glass relative max-w-lg w-full p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg,#55705a,#3c4f40)" }}>🤖</div>
          <h1 className="grad-text mt-4 text-4xl">Got it — my turn</h1>
          <p className="mt-2 text-sm text-muted">I&apos;m making your first 2 posts now. Taking you there…</p>
          <div className="mt-6">
            <a href="/review" className="btn-primary">See them appear →</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="stage flex items-center justify-center px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 480, height: 480, right: "-140px", bottom: "-160px", background: "#D9CFC0" }} />
      <div className="glass relative w-full max-w-md p-8">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">One time · 30 seconds</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Your business</h1>
        <p className="mt-1 text-center text-sm text-muted">After this, the AI works on its own. You just review.</p>
        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium">Business name</span>
            <input className="field mt-1.5" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Fashion Store" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">What do you sell?</span>
            <input className="field mt-1.5" value={sells} onChange={(e) => setSells(e.target.value)}
              placeholder="Women's native dresses" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Target customers</span>
            <input className="field mt-1.5" value={customers} onChange={(e) => setCustomers(e.target.value)}
              placeholder="Nigerian women aged 18–35" />
          </label>
          <div>
            <p className="text-sm font-medium">Preferred tone</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)} className={`pill ${tone === t ? "on" : ""}`}>{t}</button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-sm font-medium">Main topics <span className="font-normal text-muted">(optional, comma separated)</span></span>
            <input className="field mt-1.5" value={topics} onChange={(e) => setTopics(e.target.value)}
              placeholder="styling tips, new arrivals, fabrics" />
          </label>
          <div>
            <p className="text-sm font-medium">Platforms</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`pill ${platforms.includes(p.id) ? "on" : ""}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <button onClick={submit} disabled={busy} className="btn-primary w-full py-3 text-base">
            {busy ? "Saving…" : "Start my posts →"}
          </button>
        </div>
        {status && <p className="mt-3 text-center text-sm text-muted">{status}</p>}
      </div>
    </main>
  );
}
