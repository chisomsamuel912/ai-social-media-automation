"use client";
import { useEffect, useState } from "react";
import PlanResults from "@/components/PlanResults";
import type { PlannedIdea } from "@/lib/ai/engine";
import { fitScore, upcomingHolidays } from "@/lib/trends";

export default function AutopilotPage() {
  const [businessId, setBusinessId] = useState("");
  const [guide, setGuide] = useState("");
  const [ideas, setIdeas] = useState<PlannedIdea[]>([]);
  const [blocked, setBlocked] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [trend, setTrend] = useState("");
  const [checks, setChecks] = useState({ niche: false, audience: false, brand: false, timely: false });
  const holidays = upcomingHolidays();

  useEffect(() => {
    try {
      const id = localStorage.getItem("business-id") ?? "";
      setBusinessId(id);
      if (typeof window !== "undefined" && window.location.search.includes("auto=1")) {
        window.history.replaceState({}, "", "/autopilot");
        setTimeout(() => runWith(id), 600);
        return;
      }
      // Fully automatic: business exists but nothing queued → make posts unasked.
      const queue = JSON.parse(localStorage.getItem("schedule-queue") ?? "[]") as unknown[];
      if (id && queue.length === 0) {
        setTimeout(() => runWith(id, true), 800);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runWith(id: string, silent = false) {
    setBusy(true);
    setMsg(silent ? "I made these while you were away ✨" : "Making your posts…");
    try {
      const res = await fetch("/api/autopilot/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id || undefined, guide: guide || undefined, count: 5 })
      });
      const body = await res.json();
      setIdeas(body.ideas ?? []);
      setBlocked(body.blocked ?? 0);
      setName(body.businessName ?? "");
      setMsg(res.ok ? (silent ? `Fresh posts ready — review below, nothing goes out without you ✓` : "") : `Error: ${body.error ?? res.status}`);
      if (res.ok) {
        try {
          localStorage.setItem("last-plan-at", new Date().toISOString());
        } catch {}
      }
    } catch {
      setMsg("Request failed — is the dev server running?");
    }
    setBusy(false);
  }

  async function run() {
    return runWith(businessId);
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 440, height: 440, right: "-140px", top: "30%", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Step 1 · Tell the AI what matters</p>
        <h1 className="grad-text mt-1 text-center text-4xl">What should we post?</h1>
        <div className="glass mt-6 flex flex-col gap-2 p-2.5 sm:flex-row">
          <input className="field !border-0 !bg-transparent" value={guide} onChange={(e) => setGuide(e.target.value)}
            placeholder='Optional: "more about saving this week" — or leave empty' />
          <button onClick={run} disabled={busy} className="btn-primary shrink-0">{busy ? "Thinking…" : "✨ Make my plan"}</button>
        </div>
        {name && <p className="mt-2 text-center text-xs text-muted">Planning for {name} · WhatsApp + Facebook</p>}
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        <details className="glass-soft mt-3 p-4 text-sm">
          <summary className="cursor-pointer font-semibold">📅 Holiday or trend to ride? (optional)</summary>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input className="field !border-0 !bg-white/70" value={trend} onChange={(e) => setTrend(e.target.value)}
              placeholder='e.g. "Independence Day promo"' />
            <button className="btn-ghost shrink-0 !py-2 text-xs" onClick={() => {
              const s = fitScore(checks);
              if (s >= 4 && trend.trim()) { setGuide((g) => `${g} [Trend: ${trend.trim()}]`.trim()); setMsg(`Nice — "${trend.trim()}" fits your business, added ✓`); }
              else setMsg(`Skipped — that doesn't fit your business, so the AI will ignore it.`);
            }}>Check if it fits</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(checks) as Array<keyof typeof checks>).map((k) => (
              <button key={k} onClick={() => setChecks((c) => ({ ...c, [k]: !c[k] }))}
                className={`pill ${checks[k] ? "on" : ""}`}>{checks[k] ? "✓ " : ""}fits my {k === "timely" ? "timing" : k === "niche" ? "business" : k}</button>
            ))}
          </div>
          {holidays.length > 0 && (
            <p className="mt-2 text-xs text-muted">Coming up: {holidays.slice(0, 3).map((h) => `${h.name} (${h.date})`).join(" · ")}</p>
          )}
        </details>

        <div className="mt-4"><PlanResults ideas={ideas} blocked={blocked} businessName={name} /></div>

        <p className="mt-6 text-center text-xs text-muted">
          Need one special post? <a href="/create" className="underline">Make it here →</a>
          {" · "}Selling something with a price? <a href="/brand" className="underline">Tell the AI once →</a>
        </p>
      </div>
    </main>
  );
}
