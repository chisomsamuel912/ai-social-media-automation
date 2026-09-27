"use client";
import { useEffect, useState } from "react";

interface PendingItem {
  postId: string;
  idea: { topic: string; angle: string; format: string; pillar: string } | null;
  variants: Array<{ platform: string; caption: string; hashtags: string[] }>;
}

const PLATFORM_STYLE: Record<string, { icon: string; note: string }> = {
  whatsapp: { icon: "💬", note: "WhatsApp style: short chat message" },
  facebook: { icon: "📘", note: "Facebook style: fuller story" }
};

export default function ReviewPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [msg, setMsg] = useState("Checking for posts the AI made for you…");
  const [busy, setBusy] = useState(false);

  async function load() {
    let businessId: string | null = null;
    try {
      businessId = localStorage.getItem("business-id");
    } catch {}
    if (!businessId) {
      setMsg("Finish Setup first — then the AI starts making posts for you.");
      return;
    }
    try {
      const res = await fetch(`/api/review/pending?businessId=${businessId}`);
      const body = await res.json();
      if (body.offline) {
        setMsg("You're offline — make a plan in Posts and approve it there.");
        return;
      }
      setItems(body.items ?? []);
      setMsg(body.items?.length ? "" : "All caught up ✨ — the AI makes a fresh batch every week.");
    } catch {
      setMsg("Couldn't load. Is the server running?");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(ids: string[]) {
    setBusy(true);
    try {
      const res = await fetch("/api/review/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: ids })
      });
      const body = await res.json();
      if (res.ok) window.location.href = "/schedule";
      else setMsg(`Error: ${body.error ?? res.status}`);
    } catch {
      setMsg("Request failed.");
    }
    setBusy(false);
  }

  async function drop(postId: string) {
    setItems(items.filter((i) => i.postId !== postId));
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-90px", background: "#9CAF88" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Step 2 · Your call</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Posts waiting for you</h1>
        <p className="mt-1 text-center text-sm text-muted">The AI made these. Nothing goes out until you say so.</p>
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        {items.length > 0 && (
          <button onClick={() => approve(items.map((i) => i.postId))} disabled={busy}
            className="btn-primary mt-4 w-full py-3 text-base">
            {busy ? "Scheduling…" : `Approve all ${items.length} →`}
          </button>
        )}

        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <div key={item.postId} className="glass lift p-5">
              <p className="serif text-xl">{item.idea?.topic ?? "Untitled"}</p>
              <p className="text-xs text-muted">Why this post: {item.idea?.angle} · Style: {item.idea?.format}</p>
              <div className="mt-3 grid gap-2">
                {item.variants.map((v) => (
                  <div key={v.platform} className="glass-soft p-3 text-sm">
                    <p className="font-semibold">
                      {PLATFORM_STYLE[v.platform]?.icon ?? "📣"} {v.platform}
                      <span className="ml-2 font-normal text-muted">· {PLATFORM_STYLE[v.platform]?.note ?? "platform style"}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-muted">{v.caption}</p>
                    {v.hashtags.length > 0 && <p className="mt-1 text-xs text-sky-700">{v.hashtags.join(" ")}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => approve([item.postId])} disabled={busy} className="btn-primary !py-1.5 text-xs">Approve ✓</button>
                <button onClick={() => drop(item.postId)} className="btn-ghost !py-1.5 text-xs">Skip</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-muted">
          Want different posts? <a href="/autopilot" className="underline">Make a fresh plan →</a>
        </div>
      </div>
    </main>
  );
}
