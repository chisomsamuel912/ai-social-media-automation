"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SessionChip from "@/components/SessionChip";
import { useAuth } from "@/components/AuthProvider";
import { loadQueue } from "@/lib/queue";

interface Attention {
  label: string;
  href: string;
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
  const [loopState, setLoopState] = useState({ setup: false, review: false, posted: false });
  const [autoOn, setAutoOn] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    (async () => {
      const list: Attention[] = [];
      try {
        const bid = localStorage.getItem("business-id");
        const hasBusiness = Boolean(bid);
        if (!hasBusiness) {
          list.push({ label: "Tell the AI about your business — 30 seconds", href: "/onboarding" });
        } else {
          try {
            const pr = await fetch(`/api/review/pending?businessId=${bid}`).then((r) => r.json()).catch(() => null);
            const n = pr?.items?.length ?? 0;
            if (n > 0) {
              list.push({ label: `✨ ${n} post${n > 1 ? "s" : ""} the AI made — waiting for your approval`, href: "/review" });
            }
          } catch {}
        }
        const queue = loadQueue();
        setLoopState({
          setup: hasBusiness,
          review: queue.length > 0,
          posted: queue.some((q) => q.status === "published")
        });
        const due = queue.filter((q) => q.status === "scheduled" && new Date(q.scheduledAt).getTime() <= Date.now());
        if (due.length > 0) {
          list.push({ label: `⏰ ${due.length} post${due.length > 1 ? "s" : ""} due — time to publish`, href: "/schedule" });
        }
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
        <div className="flex justify-end">
          <SessionChip />
        </div>
        <p className="text-sm text-muted">Your AI handles your socials — you just review.</p>
        <h1 className="grad-text mt-2 text-5xl">Growpilot</h1>

        <div className="glass mt-6 p-5">
          <p className="font-semibold">How it works</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <LoopStep n="1" title="Setup once" desc="Your business, in plain words" href="/onboarding" done={loopState.setup} />
            <LoopStep n="2" title="Review" desc="AI posts appear, you approve" href="/review" done={loopState.review} />
            <LoopStep n="3" title="Posted" desc="Scheduled & published" href="/schedule" done={loopState.posted} />
          </div>
        </div>

        <div className="glass mt-4 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl">{autoOn ? "🤖" : "😴"}</span>
          <div className="text-sm">
            <b>Automatic manager: {autoOn ? "ON" : "PAUSED"}</b>
            <p className="text-muted">
              {autoOn ? "Fresh posts appear on their own — you only approve." : "Paused — nothing new will be made until you resume."}
            </p>
          </div>
          <button onClick={() => setAutoOn(!autoOn)} className={autoOn ? "btn-ghost ml-auto !py-1.5 text-xs" : "btn-primary ml-auto !py-1.5 text-xs"}>
            {autoOn ? "Pause" : "Resume"}
          </button>
        </div>

        <div className="glass mt-4 p-5">
          <p className="font-semibold">What needs your attention?</p>
          {attention.length === 0 && (
            <p className="mt-1 text-sm text-muted">All clear ✨ — new posts will appear here on their own.</p>
          )}
          <div className="mt-2 grid gap-2">
            {attention.map((a) => (
              <a key={a.label} href={a.href} className="glass-soft lift block px-4 py-3 text-sm">
                <b>{a.label}</b> <span className="text-muted">→</span>
              </a>
            ))}
          </div>
        </div>

        <div className="glass mt-4 p-5">
          <p className="font-semibold">Beta feedback</p>
          <p className="text-xs text-muted">Bugs, ideas, or “my social feels handled” stories.</p>
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
          Health: <a className="underline" href="/api/health">/api/health</a> · <a className="underline" href="/privacy">Privacy</a> · <a className="underline" href="/terms">Terms</a>
        </p>
      </div>
    </main>
  );
}
