"use client";
import { useEffect, useState } from "react";
import { EMPTY_DRAFT, MVP_PLATFORMS, completeness, type OnboardingDraft } from "@/lib/onboarding";

const STEPS = ["Business", "Audience", "Preferences", "Platforms", "Sales & dates"];

function field(label: string, node: React.ReactNode) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{node}</div>
    </label>
  );
}
const inputCls = "w-full rounded-xl border bg-white px-3 py-2 text-sm";

export default function OnboardingPage() {
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [doneId, setDoneId] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding-draft");
      if (raw) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("onboarding-draft", JSON.stringify(draft));
    } catch {}
  }, [draft]);

  const set = (k: keyof OnboardingDraft, v: string | string[]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const score = completeness(draft);

  async function submit() {
    setStatus("Saving…");
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setDoneId(body.businessId);
      try {
        localStorage.setItem("business-id", body.businessId);
        localStorage.removeItem("onboarding-draft");
      } catch {}
      setStatus("");
    } else {
      setStatus(body.error === "supabase-not-configured"
        ? "Supabase keys missing — add them to .env, then retry. Draft kept."
        : `Error: ${body.error ?? res.status}`);
    }
  }

  if (doneId) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl">You&apos;re set 🎉</h1>
        <p className="mt-2 text-sm text-muted">Profile completeness: {score}% · Business ID saved for Brand page.</p>
        <p className="mt-2 font-mono text-xs text-muted">{doneId}</p>
        <div className="mt-6 flex gap-2">
          <a href="/brand" className="rounded-xl bg-moss px-4 py-2 text-sm text-white">Open Brand →</a>
          <a href="/" className="rounded-xl border px-4 py-2 text-sm">Home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <p className="text-sm text-muted">Setup once · under 3 minutes</p>
      <h1 className="mt-1 text-3xl">Tell us about your business</h1>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
        <div className="h-full rounded-full bg-moss" style={{ width: `${score}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">Completeness: {score}% · Step {step + 1}/5 — {STEPS[step]}</p>

      <div className="mt-6 grid gap-4">
        {step === 0 && (<>
          {field("Business name *", <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ada's Kitchen" />)}
          {field("What do you do? *", <textarea className={inputCls} rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Jollof catering and weekly meal prep in Lagos" />)}
          {field("Products / services", <input className={inputCls} value={draft.products} onChange={(e) => set("products", e.target.value)} placeholder="Party jollof, meal-prep plans" />)}
        </>)}
        {step === 1 && (<>
          {field("Who are your customers? *", <input className={inputCls} value={draft.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Busy parents, 25–40" />)}
          {field("Location", <input className={inputCls} value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Lagos, Nigeria" />)}
        </>)}
        {step === 2 && (<>
          {field("Tone of voice", <select className={inputCls} value={draft.tone} onChange={(e) => set("tone", e.target.value)}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="playful">Playful</option><option value="bold">Bold</option></select>)}
          {field("Main topics (comma separated) *", <input className={inputCls} value={draft.topics} onChange={(e) => set("topics", e.target.value)} placeholder="saving, meal prep, behind the scenes" />)}
          {field("Topics to avoid", <input className={inputCls} value={draft.avoidTopics} onChange={(e) => set("avoidTopics", e.target.value)} placeholder="politics" />)}
          {field("Goals (comma separated)", <input className={inputCls} value={draft.goals} onChange={(e) => set("goals", e.target.value)} placeholder="orders, awareness" />)}
        </>)}
        {step === 3 && (<>
          <div><p className="text-sm font-medium">Platforms (MVP: WhatsApp + Facebook)</p>
            <div className="mt-2 grid gap-2">
              {MVP_PLATFORMS.map((p) => (
                <label key={p.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${p.enabled ? "" : "opacity-50"}`}>
                  <input type="checkbox" disabled={!p.enabled} checked={draft.platforms.includes(p.id)}
                    onChange={(e) => set("platforms", e.target.checked ? [...draft.platforms, p.id] : draft.platforms.filter((x) => x !== p.id))} />
                  {p.label}{!p.enabled && <span className="text-xs text-muted">· later</span>}
                </label>
              ))}
            </div></div>
          {field("Posting frequency", <select className={inputCls} value={draft.frequency} onChange={(e) => set("frequency", e.target.value)}><option value="let_ai_decide">Let AI decide (recommended)</option><option value="3">3 posts/week</option><option value="5">5 posts/week</option><option value="7">7 posts/week</option></select>)}
          {field("Publishing mode", <select className={inputCls} value={draft.publishingMode} onChange={(e) => set("publishingMode", e.target.value)}><option value="remind_me">🔔 Remind Me (MVP default)</option><option value="auto">⭐ Auto Publish (needs API approval)</option></select>)}
        </>)}
        {step === 4 && (<>
          {field("Sales channel", <select className={inputCls} value={draft.salesChannel} onChange={(e) => set("salesChannel", e.target.value)}><option value="whatsapp">WhatsApp</option><option value="facebook">Facebook Messenger</option><option value="website">Website / order page</option></select>)}
          <div className="rounded-2xl border bg-card p-4 text-sm" style={{ borderColor: "#E3DED2" }}>
            <p className="font-semibold">Review</p>
            <p className="text-muted">{draft.name || "—"} · {(draft.platforms.join(", ") || "—")} · {draft.frequency} · {draft.publishingMode} · → {draft.salesChannel}</p>
          </div>
        </>)}
      </div>

      {status && <p className="mt-4 text-sm text-muted">{status}</p>}
      <div className="mt-6 flex gap-2">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="rounded-xl border px-4 py-2 text-sm">Back</button>}
        {step < 4
          ? <button onClick={() => setStep(step + 1)} className="ml-auto rounded-xl bg-moss px-4 py-2 text-sm text-white">Continue</button>
          : <button onClick={submit} className="ml-auto rounded-xl bg-moss px-4 py-2 text-sm text-white">Finish setup</button>}
      </div>
    </main>
  );
}
