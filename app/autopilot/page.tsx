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
      setBusinessId(localStorage.getItem("business-id") ?? "");
    } catch {}
  }, []);

  async function run() {
    setBusy(true);
    setMsg("Planning…");
    try {
      const res = await fetch("/api/autopilot/plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: businessId || undefined, guide: guide || undefined, count: 5 })
      });
      const body = await res.json();
      setIdeas(body.ideas ?? []);
      setBlocked(body.blocked ?? 0);
      setName(body.businessName ?? "");
      setMsg(res.ok ? "" : `Error: ${body.error ?? res.status}`);
    } catch {
      setMsg("Request failed — is the dev server running?");
    }
    setBusy(false);
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 440, height: 440, right: "-140px", top: "30%", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Auto Pilot · You handle direction</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Your content plan</h1>
        <div className="glass mt-6 flex flex-col gap-2 p-2.5 sm:flex-row">
          <input className="field !border-0 !bg-transparent" value={guide} onChange={(e) => setGuide(e.target.value)}
            placeholder='Guide Me… e.g. "Focus more on saving this week"' />
          <button onClick={run} disabled={busy} className="btn-primary shrink-0">{busy ? "Planning…" : "✨ Generate"}</button>
        </div>
        {name && <p className="mt-2 text-center text-xs text-muted">Planning for {name} · WhatsApp + Facebook</p>}
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        <div className="glass-soft mt-3 p-4 text-sm">
          <p className="font-semibold">📅 Ride a trend or holiday? <span className="font-normal text-muted">Only if it fits — score ≥ 4/5</span></p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input className="field !border-0 !bg-white/70" value={trend} onChange={(e) => setTrend(e.target.value)}
              placeholder='e.g. "Independence Day promo"' />
            <button className="btn-ghost shrink-0 !py-2 text-xs" onClick={() => {
              const s = fitScore(checks);
              if (s >= 4 && trend.trim()) { setGuide((g) => `${g} [Trend: ${trend.trim()}]`.trim()); setMsg(`Trend accepted (${s}/5) — added to your guide ✓`); }
              else setMsg(`Trend skipped (${s}/5) — needs 4+. It doesn't fit, so the AI will ignore it.`);
            }}>Check fit</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(checks) as Array<keyof typeof checks>).map((k) => (
              <button key={k} onClick={() => setChecks((c) => ({ ...c, [k]: !c[k] }))}
                className={`pill ${checks[k] ? "on" : ""}`}>{checks[k] ? "✓ " : ""}fits {k}</button>
            ))}
          </div>
          {holidays.length > 0 && (
            <p className="mt-2 text-xs text-muted">Coming up: {holidays.slice(0, 3).map((h) => `${h.name} (${h.date})`).join(" · ")}</p>
          )}
        </div>

        <div className="mt-4"><PlanResults ideas={ideas} blocked={blocked} businessName={name} /></div>
      </div>
    </main>
  );
}
