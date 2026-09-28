"use client";
import { useState } from "react";
import { downloadText, type StarterPost } from "@/lib/starter";

type Plat = "whatsapp" | "facebook" | "instagram";
const PLATS: Array<{ id: Plat; label: string }> = [
  { id: "whatsapp", label: "💬 WhatsApp" },
  { id: "facebook", label: "📘 Facebook" },
  { id: "instagram", label: "📸 Instagram" }
];

function PostCard({ post, onRegen, onChange, busy }: {
  post: StarterPost;
  onRegen: () => void;
  onChange: (caption: string) => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `${post.hook}\n\n${post.caption}\n\n${post.hashtags.join(" ")}\n${post.cta}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="glass lift p-5">
      <div className="flex items-center gap-2">
        <span className="pill">{post.type}</span>
        <span className="pill">{post.platform}</span>
        <div className="ml-auto flex gap-1.5">
          <button onClick={onRegen} disabled={busy} className="btn-ghost !py-1 text-xs">↻ Regenerate</button>
          <button onClick={() => setEditing(!editing)} className="btn-ghost !py-1 text-xs">{editing ? "Done" : "✏️ Edit"}</button>
          <button onClick={copy} className="btn-ghost !py-1 text-xs">{copied ? "Copied ✓" : "📋 Copy"}</button>
        </div>
      </div>
      <p className="serif mt-2 text-xl">{post.hook}</p>
      {editing ? (
        <textarea className="field mt-2" rows={4} value={post.caption} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="mt-1 whitespace-pre-line text-sm text-muted">{post.caption}</p>
      )}
      {post.hashtags.length > 0 && <p className="mt-1 text-xs text-sky-700">{post.hashtags.join(" ")}</p>}
      <p className="mt-1 text-sm font-semibold">{post.cta}</p>
    </div>
  );
}

export default function StartPage() {
  const [business, setBusiness] = useState("");
  const [platform, setPlatform] = useState<Plat>("whatsapp");
  const [posts, setPosts] = useState<StarterPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [regenIdx, setRegenIdx] = useState(-1);
  const [msg, setMsg] = useState("");

  async function make(count = 5): Promise<StarterPost[]> {
    const res = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business, platform, count })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? res.status);
    return body.posts ?? [];
  }

  async function generate() {
    if (business.trim().length < 3) {
      setMsg("Tell me what you sell first — e.g. “I sell rechargeable fans.”");
      return;
    }
    setBusy(true);
    setMsg("Writing your 5 posts…");
    try {
      setPosts(await make(5));
      setMsg("");
    } catch {
      setMsg("Couldn't reach the AI — check your connection and retry.");
    }
    setBusy(false);
  }

  async function regenerate(i: number) {
    setRegenIdx(i);
    try {
      const [fresh] = await make(1);
      if (fresh) setPosts((prev) => prev.map((p, ix) => (ix === i ? { ...fresh, id: p.id } : p)));
    } catch {}
    setRegenIdx(-1);
  }

  function download() {
    const blob = new Blob([downloadText(posts, business)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-posts.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 440, height: 440, left: "-130px", top: "-110px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 460, height: 460, right: "-140px", top: "25%", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Free · No account needed</p>
        <h1 className="grad-text mt-1 text-center text-4xl">What do you sell?</h1>
        <p className="mt-1 text-center text-sm text-muted">Type one line. Pick where you post. Get 5 ready posts.</p>

        <div className="glass mt-6 p-3">
          <input className="field !border-0 !bg-transparent text-lg" value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="I sell rechargeable fans"
            onKeyDown={(e) => e.key === "Enter" && generate()} />
          <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 pb-1">
            {PLATS.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className={`pill ${platform === p.id ? "on" : ""}`}>{p.label}</button>
            ))}
            <button onClick={generate} disabled={busy} className="btn-primary ml-auto">
              {busy ? "Writing…" : "✨ Make my 5 posts"}
            </button>
          </div>
        </div>
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        {posts.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button onClick={download} className="btn-ghost !py-1.5 text-xs">⬇ Download all (.txt)</button>
          </div>
        )}
        <div className="mt-3 grid gap-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} busy={regenIdx === i}
              onRegen={() => regenerate(i)}
              onChange={(caption) => setPosts((prev) => prev.map((x, ix) => (ix === i ? { ...x, caption } : x)))} />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Like this? <a href="/login" className="underline">Create a free account</a> to save your business and get fresh posts every week, automatically.
        </p>
      </div>
    </main>
  );
}
