"use client";
import { useEffect, useState } from "react";
import PlanResults from "@/components/PlanResults";
import type { PlannedIdea } from "@/lib/ai/engine";

export default function AutopilotPage() {
  const [businessId, setBusinessId] = useState("");
  const [guide, setGuide] = useState("");
  const [ideas, setIdeas] = useState<PlannedIdea[]>([]);
  const [blocked, setBlocked] = useState(0);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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
        <div className="mt-4"><PlanResults ideas={ideas} blocked={blocked} /></div>
      </div>
    </main>
  );
}
