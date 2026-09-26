"use client";
import { useEffect, useState } from "react";

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

  async function deleteEverything() {
    if (!confirm("Permanently delete this business and everything attached, on this device and online?")) return;
    if (!confirm("Last check — really delete everything?")) return;
    await fetch("/api/account", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, confirm: "delete-everything" })
    }).catch(() => {});
    try {
      for (const k of ["business-id", "onboarding-draft", "schedule-queue", "device-metrics", "customer-inbox"]) {
        localStorage.removeItem(k);
      }
    } catch {}
    setBusinessId("");
    setFacts([]);
    setAssets([]);
    setMsg("Everything deleted. Fresh start — see you at onboarding.");
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 400, height: 400, right: "-120px", top: "-100px", background: "#D9CFC0" }} />
      <div className="orb orb-b" style={{ width: 360, height: 360, left: "-120px", bottom: "-140px", background: "#9CAF88" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Brand · Media · Truths</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Your brand & truths</h1>
        <p className="mt-1 text-center text-sm text-muted">The AI only uses facts saved here — it never invents prices or policies.</p>

        <div className="glass mt-6 flex items-center gap-2 p-2.5">
          <input className="field !border-0 !bg-transparent" value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="Business ID (auto-filled after onboarding)" />
          <button onClick={load} className="btn-primary shrink-0">Load</button>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setTab("facts")} className={tab === "facts" ? "btn-primary" : "btn-ghost"}>Verified Facts</button>
          <button onClick={() => setTab("media")} className={tab === "media" ? "btn-primary" : "btn-ghost"}>Media Library</button>
        </div>

        {msg && <p className="mt-3 text-center text-sm text-muted">{msg}</p>}

        <div className="glass mt-4 p-5">
          {tab === "facts" && (
            <div className="grid gap-2.5">
              {facts.length === 0 && <p className="text-sm text-muted">No facts yet. Add prices, products, delivery info…</p>}
              {facts.map((f) => (
                <div key={f.key} className="glass-soft flex gap-2 px-3 py-2.5 text-sm">
                  <b>{f.key}</b><span className="text-muted">{f.value}</span>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="field" value={fKey} onChange={(e) => setFKey(e.target.value)} placeholder="e.g. jollof-party-price" />
                <input className="field" value={fVal} onChange={(e) => setFVal(e.target.value)} placeholder="e.g. ₦25,000 per tray" />
                <button onClick={saveFact} className="btn-primary shrink-0">Save</button>
              </div>
            </div>
          )}
          {tab === "media" && (
            <div className="grid gap-2.5">
              {assets.length === 0 && <p className="text-sm text-muted">No media yet. Paste an image URL (file upload comes with Storage wiring).</p>}
              {assets.map((a) => (
                <div key={a.id} className="glass-soft truncate px-3 py-2.5 text-sm">🖼 {a.url}</div>
              ))}
              <div className="flex gap-2">
                <input className="field" value={mUrl} onChange={(e) => setMUrl(e.target.value)} placeholder="https://…/product-photo.jpg" />
                <button onClick={saveMedia} className="btn-primary shrink-0">Add</button>
              </div>
              <p className="text-xs text-muted">Rule: promo posts prefer your real photo; educational posts use a template.</p>
            </div>
          )}
        </div>

        <div className="glass mt-6 p-5">
          <p className="font-semibold">Danger zone</p>
          <p className="text-xs text-muted">Permanently removes your business, facts, media, metrics, and inbox — online and on this device.</p>
          <button onClick={deleteEverything} className="mt-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Delete my data
          </button>
        </div>
      </div>
    </main>
  );
}
