"use client";
import type { PlannedIdea } from "@/lib/ai/engine";
import { queueKey, suggestTimes, type QueueItem } from "@/lib/scheduling";
import VisualPreview from "./VisualPreview";

const PLATFORM_ICON: Record<string, string> = { whatsapp: "💬", facebook: "📘", instagram: "📸", tiktok: "🎵" };

export function loadQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem("schedule-queue") ?? "[]");
  } catch {
    return [];
  }
}

export default function PlanResults({ ideas, blocked, businessName }: { ideas: PlannedIdea[]; blocked: number; businessName?: string }) {
  function approveAll() {
    const slots = suggestTimes(ideas.reduce((n, i) => n + i.variants.length, 0));
    let s = 0;
    const items: QueueItem[] = [];
    for (const idea of ideas) {
      for (const v of idea.variants) {
        const slot = slots[s++];
        items.push({
          key: queueKey(idea.topic, v.platform, slot),
          topic: idea.topic,
          platform: v.platform,
          caption: v.caption,
          hashtags: v.hashtags,
          scheduledAt: slot,
          status: "scheduled"
        });
      }
    }
    const existing = loadQueue();
    const keys = new Set(existing.map((q) => q.key));
    const merged = [...existing, ...items.filter((q) => !keys.has(q.key))];
    try {
      localStorage.setItem("schedule-queue", JSON.stringify(merged));
    } catch {}
    window.location.href = "/schedule";
  }
  if (ideas.length === 0) return <p className="text-sm text-muted">No fresh ideas — everything matched recent history. Try a different guide.</p>;
  return (
    <div className="grid gap-3">
      {blocked > 0 && (
        <div className="glass-soft px-4 py-2.5 text-xs text-muted">
          {blocked} duplicate{blocked > 1 ? "s" : ""} held back · 0 recent duplicates in this batch
        </div>
      )}
      {ideas.map((idea, i) => (
        <div key={i} className="glass lift p-5">
          <div className="flex items-center gap-2">
            <span className="pill">{idea.format}</span>
            <span className="pill">{idea.pillar}</span>
            {idea.needsInfo && <span className="pill" style={{ background: "#F5EAD3", color: "#7A5C2E", borderColor: "#D9C39A" }}>⚠ missing facts</span>}
          </div>
          <p className="serif mt-2 text-xl">{idea.topic}</p>
          <p className="text-xs text-muted">angle: {idea.angle}</p>
          <VisualPreview topic={idea.topic} angle={idea.angle} businessName={businessName} />
          {idea.needsInfo && (
            <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: "#F5EAD3", border: "1px solid #D9C39A" }}>
              <b>Missing important information.</b> This promo makes concrete claims but no verified facts exist.{" "}
              <a href="/brand" className="underline">Add details in Brand</a> — the AI won&apos;t invent them.
            </div>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {idea.variants.map((v) => (
              <div key={v.platform} className="glass-soft p-3 text-sm">
                <p className="font-semibold">{PLATFORM_ICON[v.platform] ?? "📣"} {v.platform}</p>
                <p className="mt-1 whitespace-pre-line text-muted">{v.caption}</p>
                {v.hashtags.length > 0 && <p className="mt-1 text-xs text-sky-700">{v.hashtags.join(" ")}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={approveAll} className="btn-primary w-full py-3 text-base">
        Approve All & Schedule →
      </button>
    </div>
  );
}
