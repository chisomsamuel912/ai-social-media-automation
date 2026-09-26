"use client";
import { useState } from "react";
import PlanResults from "@/components/PlanResults";
import type { PlannedIdea } from "@/lib/ai/engine";

const EXAMPLES = ["I have a new product", "Announce our discount", "Create content about budgeting", "Promote this weekend event"];

export default function CreatePage() {
  const [prompt, setPrompt] = useState("");
  const [ideas, setIdeas] = useState<PlannedIdea[]>([]);
  const [blocked, setBlocked] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (prompt.trim().length < 3) { setMsg("Type a few words first."); return; }
    setBusy(true);
    setMsg("Creating…");
    try {
      const res = await fetch("/api/content/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const body = await res.json();
      setIdeas(body.ideas ?? []);
      setBlocked(body.blocked ?? 0);
      setMsg(res.ok ? "" : `Error: ${body.error ?? res.status}`);
    } catch {
      setMsg("Request failed — is the dev server running?");
    }
    setBusy(false);
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 400, height: 400, right: "-120px", top: "-80px", background: "#C9D6E2" }} />
      <div className="orb orb-b" style={{ width: 420, height: 420, left: "-130px", bottom: "-140px", background: "#9CAF88" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">＋ Create Content</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Make something specific</h1>
        <div className="glass mt-6 p-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="field !border-0 !bg-transparent" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="I have a new product…" onKeyDown={(e) => e.key === "Enter" && run()} />
            <button onClick={run} disabled={busy} className="btn-primary shrink-0">{busy ? "Creating…" : "Create ✨"}</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)} className="pill">“{ex}”</button>
            ))}
          </div>
        </div>
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}
        <div className="mt-4"><PlanResults ideas={ideas} blocked={blocked} /></div>
      </div>
    </main>
  );
}
