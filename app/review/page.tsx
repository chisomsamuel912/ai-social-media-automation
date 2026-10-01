"use client";
import { useEffect, useState } from "react";
import VisualPreview from "@/components/VisualPreview";

interface PendingItem {
  postId: string;
  idea: { topic: string; angle: string; format: string; pillar: string } | null;
  variants: Array<{ platform: string; caption: string; hashtags: string[] }>;
}

function VariantCard({ postId, v, businessName, onChanged }: {
  postId: string;
  v: PendingItem["variants"][number];
  businessName: string;
  onChanged: (caption: string, hashtags: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(v.caption);
  const [aiNote, setAiNote] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveEdit() {
    setBusy(true);
    const res = await fetch("/api/review/variant", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, platform: v.platform, caption: draft })
    });
    if (res.ok) {
      onChanged(draft, v.hashtags);
      setEditing(false);
    }
    setBusy(false);
  }

  async function aiEdit() {
    if (!aiNote.trim()) return;
    setBusy(true);
    const res = await fetch("/api/review/variant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, platform: v.platform, instruction: aiNote.trim() })
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.variant) {
      onChanged(body.variant.caption, body.variant.hashtags ?? []);
      setDraft(body.variant.caption);
      setAiNote("");
      setShowAi(false);
    }
    setBusy(false);
  }

  async function redo() {
    setBusy(true);
    const res = await fetch("/api/review/variant", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, platform: v.platform })
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.variant) {
      onChanged(body.variant.caption, body.variant.hashtags ?? []);
      setDraft(body.variant.caption);
    }
    setBusy(false);
  }

  return (
    <div className="glass-soft p-4">
      <p className="font-semibold">
        {v.platform === "whatsapp" ? "💬 WhatsApp" : v.platform === "facebook" ? "📘 Facebook" : `📸 ${v.platform}`}
        <span className="ml-2 font-normal text-muted">· written for {v.platform}</span>
      </p>
      {editing ? (
        <textarea className="field mt-2" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
      ) : (
        <p className="mt-1 whitespace-pre-line text-sm text-muted">{v.caption}</p>
      )}
      {v.hashtags.length > 0 && <p className="mt-1 text-xs text-sky-700">{v.hashtags.join(" ")}</p>}
      {showAi && (
        <div className="mt-2 flex gap-2">
          <input className="field !py-1.5 text-sm" value={aiNote} onChange={(e) => setAiNote(e.target.value)}
            placeholder='Tell the AI what to change… e.g. "shorter and funnier"' />
          <button onClick={aiEdit} disabled={busy} className="btn-primary shrink-0 !py-1.5 text-xs">Apply</button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {editing
          ? <><button onClick={saveEdit} disabled={busy} className="btn-primary !py-1 text-xs">Save</button>
              <button onClick={() => { setDraft(v.caption); setEditing(false); }} className="btn-ghost !py-1 text-xs">Cancel</button></>
          : <><button onClick={() => setEditing(true)} className="btn-ghost !py-1 text-xs">✏️ Edit</button>
              <button onClick={() => setShowAi(!showAi)} className="btn-ghost !py-1 text-xs">✨ AI Edit</button>
              <button onClick={redo} disabled={busy} className="btn-ghost !py-1 text-xs">🔄 Redo</button></>}
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [businessName, setBusinessName] = useState("");
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
        setMsg("You're offline — reconnect and your posts will appear here.");
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

  function patchVariant(postId: string, platform: string, caption: string, hashtags: string[]) {
    setItems((prev) => prev.map((it) => it.postId === postId
      ? { ...it, variants: it.variants.map((x) => x.platform === platform ? { ...x, caption, hashtags } : x) }
      : it));
  }

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

  async function reject(postId: string) {
    await fetch(`/api/review/post?postId=${postId}`, { method: "DELETE" }).catch(() => {});
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
              <p className="text-xs text-muted">Why this post: {item.idea?.angle}</p>
              {item.idea && (
                <VisualPreview topic={item.idea.topic} angle={item.idea.angle} businessName={businessName || undefined} />
              )}
              <div className="mt-3 grid gap-2">
                {item.variants.map((v) => (
                  <VariantCard key={v.platform} postId={item.postId} v={v} businessName={businessName}
                    onChanged={(caption, hashtags) => patchVariant(item.postId, v.platform, caption, hashtags)} />
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => approve([item.postId])} disabled={busy} className="btn-primary !py-1.5 text-xs">Approve ✓</button>
                <button onClick={() => reject(item.postId)} className="btn-ghost !py-1.5 text-xs">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
