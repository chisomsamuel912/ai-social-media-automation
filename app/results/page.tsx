"use client";
import { useEffect, useState } from "react";
import type { Insight } from "@/lib/learner";

interface Row {
  platform: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
}

export default function ResultsPage() {
  const [businessId, setBusinessId] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stored, setStored] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const id = localStorage.getItem("business-id") ?? "";
      setBusinessId(id);
      const dev = JSON.parse(localStorage.getItem("device-metrics") ?? "[]");
      setRows(dev);
      if (id) {
        fetch(`/api/results?businessId=${id}`).then((r) => r.json()).then((b) => {
          if (b.metrics) setRows((prev) => [...(b.metrics as Row[]), ...prev]);
          if (b.learnings) setStored((b.learnings as Array<{ insight_text: string }>).map((l) => l.insight_text));
        }).catch(() => {});
      }
    } catch {}
  }, []);

  async function runLearning() {
    setBusy(true);
    setMsg("Learning…");
    try {
      const res = await fetch("/api/learn", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: businessId || undefined, rows })
      });
      const body = await res.json();
      setInsights(body.insights ?? []);
      setMsg(body.insights?.length ? (body.stored ? "Learned + stored ✓" : "Learned on-device (Supabase offline).") : "Not enough data yet — publish and log a few results first.");
    } catch {
      setMsg("Request failed.");
    }
    setBusy(false);
  }

  const totals = rows.reduce((s, r) => ({ views: s.views + r.views, likes: s.likes + r.likes, comments: s.comments + r.comments }), { views: 0, likes: 0, comments: 0 });

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, right: "-130px", top: "-90px", background: "#9CAF88" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">📊 Results · Analytics → Learning</p>
        <h1 className="grad-text mt-1 text-center text-4xl">What&apos;s working</h1>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {[["Views", totals.views], ["Likes", totals.likes], ["Comments", totals.comments]].map(([label, v]) => (
            <div key={label as string} className="glass p-4 text-center">
              <p className="serif num text-3xl">{v as number}</p>
              <p className="text-xs text-muted">{label as string}</p>
            </div>
          ))}
        </div>

        <div className="glass mt-3 p-5">
          <div className="flex items-center">
            <p className="font-semibold">✨ What AI learned</p>
            <button onClick={runLearning} disabled={busy} className="btn-primary ml-auto !py-1.5 text-xs">
              {busy ? "Learning…" : "Run learning"}
            </button>
          </div>
          {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
          <div className="mt-3 grid gap-2">
            {insights.map((i, ix) => (
              <div key={ix} className="glass-soft p-3 text-sm">
                <b>{i.text}</b><br /><span className="text-muted">{i.change}</span>
              </div>
            ))}
            {stored.map((s, ix) => (
              <div key={`s-${ix}`} className="p-3 text-sm text-muted">📚 {s}</div>
            ))}
            {insights.length === 0 && stored.length === 0 && (
              <p className="text-sm text-muted">No insights yet. Log results on the Schedule page, then run learning.</p>
            )}
          </div>
        </div>

        <div className="glass mt-3 p-5">
          <p className="font-semibold">Logged results ({rows.length})</p>
          {rows.length === 0 && <p className="mt-1 text-sm text-muted">Nothing logged. Publish a post, then enter numbers on Schedule.</p>}
          {rows.slice(0, 10).map((r, ix) => (
            <div key={ix} className="mt-2 flex gap-2 text-sm">
              <b>{r.platform || "—"}</b>
              <span className="truncate text-muted">{r.caption.slice(0, 60)}</span>
              <span className="num ml-auto text-muted">{r.views}v · {r.likes}♥ · {r.comments}💬</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
