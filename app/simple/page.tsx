"use client";
import { useState } from "react";

type P = "whatsapp" | "facebook" | "instagram" | "tiktok";
const PLATFORMS: Array<{ id: P; label: string }> = [
  { id: "whatsapp", label: "💬 WhatsApp" },
  { id: "facebook", label: "📘 Facebook" },
  { id: "instagram", label: "📸 Instagram" },
  { id: "tiktok", label: "🎵 TikTok" }
];

interface Result {
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  via: string;
}

export default function SimplePage() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<P>("instagram");
  const [result, setResult] = useState<Result | null>(null);
  const [edited, setEdited] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  async function generate() {
    if (prompt.trim().length < 3) {
      setMsg("Tell me what you sell first — e.g. “I sell rechargeable fans”.");
      return;
    }
    setBusy(true);
    setMsg("Writing…");
    try {
      const res = await fetch("/api/simple/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform })
      });
      const body = await res.json();
      if (!res.ok) {
        setMsg(`Error: ${body.error ?? res.status}`);
      } else {
        setResult(body);
        setEdited(body.caption);
        setMsg(body.via === "template" ? "Offline mode — connect a free AI key for smarter words." : "");
      }
    } catch {
      setMsg("Request failed — is the server running?");
    }
    setBusy(false);
  }

  async function copy(text: string, which: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setMsg("Copy blocked by the browser — select the text manually.");
    }
  }

  function copyAll() {
    if (!result) return;
    copy(`${result.hook}\n\n${edited}\n\n${result.hashtags.join(" ")}\n\n${result.cta}`, "all");
  }

  return (
    <main className="stage flex min-h-screen items-center justify-center px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 440, height: 440, right: "-130px", bottom: "-140px", background: "#D9CFC0" }} />
      <div className="relative w-full max-w-xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">The tiny version · v0.1</p>
        <h1 className="grad-text mt-1 text-center text-4xl">What do you sell?</h1>

        <div className="glass mt-5 p-5">
          <input
            className="field"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. I sell rechargeable fans"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className={`pill ${platform === p.id ? "on" : ""}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={busy} className="btn-primary mt-3 w-full py-3 text-base">
            {busy ? "Writing…" : "✨ Make my post"}
          </button>
          {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}
        </div>

        {result && (
          <div className="glass mt-4 p-5">
            <div className="flex items-center gap-2">
              <p className="font-semibold">Your post · {platform}</p>
              <span className="pill ml-auto">{result.via === "template" ? "offline words" : "AI words"}</span>
            </div>

            <div className="glass-soft mt-3 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Hook</p>
              <p className="serif text-lg">{result.hook}</p>
              <button onClick={() => copy(result.hook, "hook")} className="btn-ghost mt-1 !py-1 text-xs">
                {copied === "hook" ? "Copied ✓" : "Copy hook"}
              </button>
            </div>

            <div className="glass-soft mt-2 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Caption — tap to edit</p>
              <textarea className="field mt-1 !border-0 !bg-transparent" rows={4} value={edited} onChange={(e) => setEdited(e.target.value)} />
            </div>

            <div className="glass-soft mt-2 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Hashtags</p>
              <p className="text-sm text-sky-700">{result.hashtags.join(" ") || "—"}</p>
              <button onClick={() => copy(result.hashtags.join(" "), "tags")} className="btn-ghost mt-1 !py-1 text-xs">
                {copied === "tags" ? "Copied ✓" : "Copy tags"}
              </button>
            </div>

            <div className="glass-soft mt-2 p-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Call to action</p>
              <p className="text-sm">{result.cta}</p>
              <button onClick={() => copy(result.cta, "cta")} className="btn-ghost mt-1 !py-1 text-xs">
                {copied === "cta" ? "Copied ✓" : "Copy CTA"}
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <button onClick={generate} disabled={busy} className="btn-ghost flex-1">↻ Regenerate</button>
              <button onClick={copyAll} className="btn-primary flex-1">{copied === "all" ? "Copied ✓" : "📋 Copy everything"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
