"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { loadQueue } from "@/components/PlanResults";
import { followUpDue } from "@/lib/customers";

const sections = [
  { href: "/onboarding", icon: "📝", label: "Setup", desc: "Tell the AI about your business", live: true },
  { href: "/brand", icon: "🎨", label: "My business", desc: "Prices, photos, facts", live: true },
  { href: "/autopilot", icon: "🤖", label: "Get posts", desc: "Weekly posts, made for you", live: true },
  { href: "/create", icon: "✨", label: "Special post", desc: "One post about something new", live: true },
  { href: "/schedule", icon: "📅", label: "My posts", desc: "What to post and when", live: true },
  { href: "/customers", icon: "💬", label: "Messages", desc: "Replies and customers", live: true },
  { href: "/results", icon: "📊", label: "Growth", desc: "What works, what to do more", live: true }
];

interface Attention {
  label: string;
  href: string;
  tone: string;
}

function LoopStep({ n, title, desc, href, done }: { n: string; title: string; desc: string; href: string; done: boolean }) {
  return (
    <a href={href} className="glass-soft lift block p-4">
      <p className="flex items-center gap-2 font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs text-white" style={{ background: done ? "#4A5D4E" : "#B9B2A4" }}>
          {done ? "✓" : n}
        </span>
        {title}
      </p>
      <p className="mt-1 text-xs text-muted">{desc}</p>
    </a>
  );
}

export default function Page() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [attention, setAttention] = useState<Attention[]>([]);
  const [loopState, setLoopState] = useState({ setup: false, planned: false, posted: false, grew: false });
  const [feedback, setFeedback] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    (async () => {
    const list: Attention[] = [];
    try {
      const hasBusiness = Boolean(localStorage.getItem("business-id"));
      if (!hasBusiness) {
        list.push({ label: "Finish setup — 3 minutes, then the AI can plan for you", href: "/onboarding", tone: "amber" });
      } else {
        try {
          const bid = localStorage.getItem("business-id");
          const pr = await fetch(`/api/review/pending?businessId=${bid}`).then((r) => r.json()).catch(() => null);
          const n = pr?.items?.length ?? 0;
          if (n > 0) list.push({ label: `✨ ${n} post${n > 1 ? "s" : ""} the AI made — waiting for your approval`, href: "/review", tone: "green" });
        } catch {}
      }
      const queue = loadQueue();
      setLoopState({
        setup: hasBusiness,
        planned: queue.length > 0,
        posted: queue.some((q) => q.status === "published"),
        grew: (() => {
          try {
            return (JSON.parse(localStorage.getItem("device-metrics") ?? "[]") as unknown[]).length > 0;
          } catch {
            return false;
          }
        })()
      });
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
    })();
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

  if (!ready || !user) {
    return (
      <main className="stage flex items-center justify-center">
        <p className="text-sm text-muted">Taking you to sign in…</p>
      </main>
    );
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
          <p className="font-semibold">How it works — the loop that runs your socials</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <LoopStep n="1" title="Tell it once" desc="Your business, your voice" href="/onboarding" done={loopState.setup} />
            <LoopStep n="2" title="Get posts" desc="Text + pictures, made for you" href="/autopilot" done={loopState.planned} />
            <LoopStep n="3" title="Post" desc="Copy, paste, done" href="/schedule" done={loopState.posted} />
            <LoopStep n="4" title="Grow" desc="See what works, AI learns" href="/results" done={loopState.grew} />
          </div>
        </div>

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

        <details className="mt-6">
          <summary className="cursor-pointer text-center text-sm text-muted underline">More tools (special post, messages, settings…)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sections.map((s) => (
              <a key={s.href} href={s.href} className="glass lift p-5">
                <p className="text-lg font-semibold">{s.icon} {s.label}</p>
                <p className="text-sm text-muted">{s.desc}</p>
                <p className="mt-2 font-mono text-xs text-muted">{s.href} →</p>
              </a>
            ))}
          </div>
        </details>

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
