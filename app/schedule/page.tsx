"use client";
import { useEffect, useState } from "react";
import { buildCopyPack, type QueueItem } from "@/lib/scheduling";
import { loadQueue } from "@/components/PlanResults";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function SchedulePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [copied, setCopied] = useState("");
  const [metrics, setMetrics] = useState<Record<string, { views: string; likes: string; comments: string }>>({});
  const [msg, setMsg] = useState("");
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    setQueue(loadQueue());
    try {
      setBusinessId(localStorage.getItem("business-id") ?? "");
    } catch {}
    fetch("/api/cron/dispatch").catch(() => {});
  }, []);

  function save(q: QueueItem[]) {
    setQueue(q);
    try {
      localStorage.setItem("schedule-queue", JSON.stringify(q));
    } catch {}
  }

  function retime(key: string, local: string) {
    save(queue.map((i) => (i.key === key ? { ...i, scheduledAt: new Date(local).toISOString() } : i)));
  }

  async function copyPack(item: QueueItem) {
    try {
      await navigator.clipboard.writeText(buildCopyPack(item));
      setCopied(item.key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setMsg("Clipboard blocked — select and copy manually.");
    }
  }

  function markPublished(key: string) {
    save(queue.map((i) => (i.key === key ? { ...i, status: "published" } : i)));
  }

  async function saveMetrics(item: QueueItem) {
    const m = metrics[item.key] ?? { views: "", likes: "", comments: "" };
    const res = await fetch("/api/metrics/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: businessId || undefined,
        platform: item.platform,
        caption: item.caption,
        views: Number(m.views) || 0,
        likes: Number(m.likes) || 0,
        comments: Number(m.comments) || 0
      })
    });
    const body = await res.json().catch(() => ({}));
    setMsg(body.stored ? "Metrics stored ✓" : "Metrics noted on-device (Supabase offline).");
  }

  const upcoming = queue.filter((q) => q.status === "scheduled");
  const done = queue.filter((q) => q.status === "published");
  const now = Date.now();

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 400, height: 400, left: "-120px", top: "-80px", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">📅 Schedule · Remind Me</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Upcoming posts</h1>
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        {queue.length === 0 && (
          <div className="glass mt-6 p-8 text-center">
            <p className="serif text-xl">Nothing scheduled yet</p>
            <p className="mt-1 text-sm text-muted">Generate a plan, then Approve All to fill this queue.</p>
            <a href="/autopilot" className="btn-primary mt-4 inline-block">Go to Auto Pilot →</a>
          </div>
        )}

        {upcoming.length > 0 && <p className="mt-6 text-sm font-semibold">Scheduled ({upcoming.length})</p>}
        <div className="mt-2 grid gap-3">
          {upcoming.map((item) => {
            const due = new Date(item.scheduledAt).getTime() <= now;
            return (
              <div key={item.key} className="glass lift p-4">
                <div className="flex items-center gap-2 text-sm">
                  <b>{item.platform}</b>
                  {due && <span className="pill" style={{ background: "#F5EAD3", color: "#7A5C2E", borderColor: "#D9C39A" }}>⏰ due — time to post</span>}
                  <input type="datetime-local" className="field ml-auto !w-auto !py-1 text-xs"
                    value={toLocalInput(item.scheduledAt)} onChange={(e) => retime(item.key, e.target.value)} />
                </div>
                <p className="serif mt-1 text-lg">{item.topic}</p>
                <p className="whitespace-pre-line text-sm text-muted">{item.caption}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => copyPack(item)} className="btn-ghost !py-1.5 text-xs">
                    {copied === item.key ? "Copied ✓" : "📋 Copy pack"}
                  </button>
                  <button onClick={() => markPublished(item.key)} className="btn-primary !py-1.5 text-xs">Mark published ✓</button>
                </div>
              </div>
            );
          })}
        </div>

        {done.length > 0 && <p className="mt-6 text-sm font-semibold">Published ({done.length}) — log results</p>}
        <div className="mt-2 grid gap-3">
          {done.map((item) => {
            const m = metrics[item.key] ?? { views: "", likes: "", comments: "" };
            const setM = (k: "views" | "likes" | "comments", v: string) =>
              setMetrics((prev) => ({ ...prev, [item.key]: { ...m, [k]: v } }));
            return (
              <div key={item.key} className="glass p-4 opacity-90">
                <p className="text-sm"><b>{item.platform}</b> · <span className="text-muted">{item.topic}</span> <span className="pill ml-1">published ✓</span></p>
                <div className="mt-2 flex gap-2">
                  {(["views", "likes", "comments"] as const).map((k) => (
                    <input key={k} className="field" type="number" min="0" placeholder={k}
                      value={m[k]} onChange={(e) => setM(k, e.target.value)} />
                  ))}
                  <button onClick={() => saveMetrics(item)} className="btn-primary shrink-0 !py-1.5 text-xs">Save</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
