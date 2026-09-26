"use client";
import { useEffect, useState } from "react";

const inputCls = "w-full rounded-xl border bg-white px-3 py-2 text-sm";
type Tab = "facts" | "media";

export default function BrandPage() {
  const [tab, setTab] = useState<Tab>("facts");
  const [businessId, setBusinessId] = useState("");
  const [facts, setFacts] = useState<Array<{ key: string; value: string }>>([]);
  const [fKey, setFKey] = useState("");
  const [fVal, setFVal] = useState("");
  const [assets, setAssets] = useState<Array<{ id: string; url: string; type: string }>>([]);
  const [mUrl, setMUrl] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    try {
      setBusinessId(localStorage.getItem("business-id") ?? "");
    } catch {}
  }, []);

  async function load() {
    if (!businessId) { setMsg("No business yet — finish onboarding first."); return; }
    setMsg("Loading…");
    const [f, m] = await Promise.all([
      fetch(`/api/facts?businessId=${businessId}`).then((r) => r.json()),
      fetch(`/api/media?businessId=${businessId}`).then((r) => r.json())
    ]);
    setFacts(f.facts ?? []);
    setAssets(m.assets ?? []);
    setMsg(f.offline ? "Offline mode — add Supabase keys to persist." : "");
  }

  async function saveFact() {
    if (!fKey.trim() || !fVal.trim()) return;
    const res = await fetch("/api/facts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, key: fKey.trim(), value: fVal.trim() })
    });
    if (res.ok) { setFKey(""); setFVal(""); load(); }
    else setMsg("Could not save — Supabase keys missing?");
  }

  async function saveMedia() {
    if (!mUrl.trim()) return;
    const res = await fetch("/api/media", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, url: mUrl.trim(), type: "image" })
    });
    if (res.ok) { setMUrl(""); load(); }
    else setMsg("Could not save — Supabase keys missing?");
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <p className="text-sm text-muted">Brand · Media Library · Verified Facts</p>
      <h1 className="mt-1 text-3xl">Your brand & truths</h1>
      <p className="mt-1 text-sm text-muted">The AI only uses facts saved here — it never invents prices or policies.</p>

      <div className="mt-4 flex items-center gap-2">
        <input className={inputCls} value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="Business ID (auto-filled after onboarding)" />
        <button onClick={load} className="rounded-xl border px-4 py-2 text-sm">Load</button>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setTab("facts")} className={`rounded-xl px-4 py-2 text-sm ${tab === "facts" ? "bg-moss text-white" : "border"}`}>Verified Facts</button>
        <button onClick={() => setTab("media")} className={`rounded-xl px-4 py-2 text-sm ${tab === "media" ? "bg-moss text-white" : "border"}`}>Media Library</button>
      </div>

      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}

      {tab === "facts" && (
        <div className="mt-4 grid gap-3">
          {facts.length === 0 && <p className="text-sm text-muted">No facts yet. Add prices, products, delivery info…</p>}
          {facts.map((f) => (
            <div key={f.key} className="flex gap-2 rounded-xl border bg-card px-3 py-2 text-sm" style={{ borderColor: "#E3DED2" }}>
              <b>{f.key}</b><span className="text-muted">{f.value}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <input className={inputCls} value={fKey} onChange={(e) => setFKey(e.target.value)} placeholder="e.g. jollof-party-price" />
            <input className={inputCls} value={fVal} onChange={(e) => setFVal(e.target.value)} placeholder="e.g. ₦25,000 per tray" />
            <button onClick={saveFact} className="rounded-xl bg-moss px-4 py-2 text-sm text-white">Save</button>
          </div>
        </div>
      )}

      {tab === "media" && (
        <div className="mt-4 grid gap-3">
          {assets.length === 0 && <p className="text-sm text-muted">No media yet. Paste an image URL (file upload comes with Supabase Storage wiring).</p>}
          {assets.map((a) => (
            <div key={a.id} className="truncate rounded-xl border bg-card px-3 py-2 text-sm" style={{ borderColor: "#E3DED2" }}>🖼 {a.url}</div>
          ))}
          <div className="flex gap-2">
            <input className={inputCls} value={mUrl} onChange={(e) => setMUrl(e.target.value)} placeholder="https://…/product-photo.jpg" />
            <button onClick={saveMedia} className="rounded-xl bg-moss px-4 py-2 text-sm text-white">Add</button>
          </div>
          <p className="text-xs text-muted">Rule: promo posts prefer your real photo; educational posts use a template.</p>
        </div>
      )}
    </main>
  );
}
