"use client";
import { useEffect, useState } from "react";
import { loadQueue } from "@/components/PlanResults";
import { followUpDue } from "@/lib/customers";

const sections = [
  { href: "/onboarding", icon: "📝", label: "Onboarding", desc: "5-step setup · live", live: true },
  { href: "/brand", icon: "🎨", label: "Brand", desc: "Identity, media, facts · live", live: true },
  { href: "/autopilot", icon: "🤖", label: "Auto Pilot", desc: "Current plan + Guide Me · live", live: true },
  { href: "/create", icon: "✨", label: "Create", desc: "Freeform prompt → preview · live", live: true },
  { href: "/schedule", icon: "📅", label: "Schedule", desc: "Upcoming + reschedule · live", live: true },
  { href: "/customers", icon: "💬", label: "Customers", desc: "Comments, leads, follow-ups · live", live: true },
  { href: "/results", icon: "📊", label: "Results", desc: "Metrics + AI learnings · live", live: true }
];

interface Attention {
  label: string;
  href: string;
  tone: string;
}

export default function Page() {
  const [attention, setAttention] = useState<Attention[]>([]);
  const [feedback, setFeedback] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    const list: Attention[] = [];
    try {
      const hasBusiness = Boolean(localStorage.getItem("business-id"));
      if (!hasBusiness) {
        list.push({ label: "Finish setup — 3 minutes, then the AI can plan for you", href: "/onboarding", tone: "amber" });
      }
      const queue = loadQueue();
      const due = queue.filter((q) => q.status === "scheduled" && new Date(q.scheduledAt).getTime() <= Date.now());
      if (due.length > 0) list.push({ label: `⏰ ${due.length} post${due.length > 1 ? "s" : ""} due — time to publish`, href: "/schedule", tone: "amber" });
      const inbox = JSON.parse(localStorage.getItem("customer-inbox") ?? "[]") as Array<{
        status: string; isLead: boolean; followUpCount: number; followUpAt: string | null; comment: string;
      }>;
      const leads = inbox.filter((i) => i.isLead && (i.status === "lead" || i.status === "new"));
      if (leads.length > 0) list.push({ label: `🔥 ${leads.length} potential customer${leads.length > 1 ? "s" : ""} waiting`, href: "/customers", tone: "green" });
      const stuck = inbox.filter((i) => i.status === "escalated");
      if (stuck.length > 0) list.push({ label: `🙋 ${stuck.length} conversation${stuck.length > 1 ? "s" : ""} need${stuck.length > 1 ? "" : "s"} your reply`, href: "/customers", tone: "blue" });
      const now = new Date();
      const followups = inbox.filter((i) =>
        followUpDue({ followUpCount: i.followUpCount, followUpAt: i.followUpAt, status: i.status as never }, now));
      if (followups.length > 0) list.push({ label: `⏰ ${followups.length} follow-up${followups.length > 1 ? "s" : ""} due`, href: "/customers", tone: "blue" });
    } catch {}
    setAttention(list);
  }, []);

  async function sendFeedback(kind: string) {
    if (feedback.trim().length < 3) return;
    await fetch("/api/feedback", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, text: feedback })
    }).catch(() => {});
    setFeedback("");
    setThanks(true);
    setTimeout(() => setThanks(false), 2500);
  }

  return (
    <main className="stage">
      <div className="orb" style={{ width: 460, height: 460, left: "-140px", top: "-120px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 520, height: 520, right: "-160px", top: "10%", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm text-muted">Phase 9 · $0 MVP · all systems live</p>
        <h1 className="grad-text mt-2 text-5xl">Growpilot</h1>
        <p className="mt-2 max-w-xl text-muted">Give the AI direction once. Let it handle the content work.</p>

        <div className="glass mt-6 p-5">
          <p className="font-semibold">What needs your attention?</p>
          {attention.length === 0 && (
            <p className="mt-1 text-sm text-muted">All clear ✨ — generate a plan in Auto Pilot to get started.</p>
          )}
          <div className="mt-2 grid gap-2">
            {attention.map((a) => (
              <a key={a.label} href={a.href} className="glass-soft lift block px-4 py-3 text-sm">
                <b>{a.label}</b> <span className="text-muted">→</span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <a key={s.href} href={s.href} className="glass lift p-5">
              <p className="text-lg font-semibold">{s.icon} {s.label}</p>
              <p className="text-sm text-muted">{s.desc}</p>
              <p className="mt-2 font-mono text-xs text-muted">{s.href} →</p>
            </a>
          ))}
        </div>

        <div className="glass mt-6 p-5">
          <p className="font-semibold">Beta feedback</p>
          <p className="text-xs text-muted">Bugs, ideas, or “my social feels handled” stories — we read everything.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input className="field !border-0 !bg-white/70" value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="Type here…" onKeyDown={(e) => e.key === "Enter" && sendFeedback("idea")} />
            <div className="flex gap-1.5">
              <button onClick={() => sendFeedback("bug")} className="btn-ghost !py-2 text-xs">🐞 Bug</button>
              <button onClick={() => sendFeedback("idea")} className="btn-ghost !py-2 text-xs">💡 Idea</button>
              <button onClick={() => sendFeedback("handled")} className="btn-primary !py-2 text-xs">✨ Handled!</button>
            </div>
          </div>
          {thanks && <p className="mt-2 text-sm text-muted">Thanks — logged ✓</p>}
        </div>

        <p className="mt-8 font-mono text-xs text-muted">
          Health: <a className="underline" href="/api/health">/api/health</a> · <a className="underline" href="/privacy">Privacy</a> · <a className="underline" href="/terms">Terms</a> · $0 MVP
        </p>
      </div>
    </main>
  );
}
