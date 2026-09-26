"use client";
import { useEffect, useState } from "react";
import { EMPTY_DRAFT, MVP_PLATFORMS, completeness, type OnboardingDraft } from "@/lib/onboarding";

const STEPS = ["Business", "Audience", "Style", "Platforms", "Sales"];

function field(label: string, node: React.ReactNode) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5">{node}</div>
    </label>
  );
}

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
      <main className="stage flex items-center justify-center px-4 py-14">
        <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
        <div className="orb orb-b" style={{ width: 480, height: 480, right: "-140px", bottom: "-160px", background: "#D9CFC0" }} />
        <div className="glass relative max-w-lg w-full p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: "linear-gradient(135deg,#55705a,#3c4f40)" }}>🎉</div>
          <h1 className="grad-text mt-4 text-4xl">You&apos;re set</h1>
          <p className="mt-2 text-sm text-muted">Profile completeness: {score}% · Business ID saved for the Brand page.</p>
          <p className="mt-2 font-mono text-xs text-muted">{doneId}</p>
          <div className="mt-6 flex justify-center gap-2">
            <a href="/brand" className="btn-primary">Open Brand →</a>
            <a href="/" className="btn-ghost">Home</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 420, height: 420, left: "-120px", top: "-100px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 480, height: 480, right: "-140px", top: "20%", background: "#D9CFC0" }} />
      <div className="orb orb-c" style={{ width: 380, height: 380, left: "30%", bottom: "-180px", background: "#C9D6E2" }} />

      <div className="relative mx-auto max-w-xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">Setup once · under 3 minutes</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Tell us about your business</h1>

        <div className="mt-5 flex justify-center gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <span key={s} className={`pill ${i === step ? "on" : i < step ? "done" : ""}`}>{i < step ? "✓ " : ""}{s}</span>
          ))}
        </div>

        <div className="glass mt-4 p-6 sm:p-8">
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "#ECE9E2" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: "linear-gradient(90deg,#8A9B84,#4A5D4E)" }} />
          </div>
          <p className="mt-2 text-xs text-muted">Completeness {score}% · Step {step + 1} of 5</p>

          <div className="mt-5 grid gap-4">
            {step === 0 && (<>
              {field("Business name *", <input className="field" value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ada's Kitchen" />)}
              {field("What do you do? *", <textarea className="field" rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Jollof catering and weekly meal prep in Lagos" />)}
              {field("Products / services", <input className="field" value={draft.products} onChange={(e) => set("products", e.target.value)} placeholder="Party jollof, meal-prep plans" />)}
            </>)}
            {step === 1 && (<>
              {field("Who are your customers? *", <input className="field" value={draft.audience} onChange={(e) => set("audience", e.target.value)} placeholder="Busy parents, 25–40" />)}
              {field("Location", <input className="field" value={draft.location} onChange={(e) => set("location", e.target.value)} placeholder="Lagos, Nigeria" />)}
            </>)}
            {step === 2 && (<>
              {field("Tone of voice", <select className="field" value={draft.tone} onChange={(e) => set("tone", e.target.value)}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="playful">Playful</option><option value="bold">Bold</option></select>)}
              <div className="glass-soft p-3 text-xs text-muted">✨ The AI figures out topics and goals from your description and audience — no need to spell them out.</div>
            </>)}
            {step === 3 && (<>
              <div><p className="text-sm font-medium">Platforms <span className="text-muted">(MVP: WhatsApp + Facebook)</span></p>
                <div className="mt-2 grid gap-2">
                  {MVP_PLATFORMS.map((p) => (
                    <label key={p.id} className={`glass-soft flex items-center gap-2 px-3 py-2.5 text-sm ${p.enabled ? "" : "opacity-50"}`}>
                      <input type="checkbox" disabled={!p.enabled} checked={draft.platforms.includes(p.id)}
                        onChange={(e) => set("platforms", e.target.checked ? [...draft.platforms, p.id] : draft.platforms.filter((x) => x !== p.id))} />
                      {p.label}{!p.enabled && <span className="text-xs text-muted">· later</span>}
                    </label>
                  ))}
                </div></div>
              {field("Posting frequency", <select className="field" value={draft.frequency} onChange={(e) => set("frequency", e.target.value)}><option value="let_ai_decide">Let AI decide (recommended)</option><option value="3">3 posts/week</option><option value="5">5 posts/week</option><option value="7">7 posts/week</option></select>)}
              {field("Publishing mode", <select className="field" value={draft.publishingMode} onChange={(e) => set("publishingMode", e.target.value)}><option value="remind_me">🔔 Remind Me (MVP default)</option><option value="auto">⭐ Auto Publish (needs API approval)</option></select>)}
            </>)}
            {step === 4 && (<>
              {field("Sales channel", <select className="field" value={draft.salesChannel} onChange={(e) => set("salesChannel", e.target.value)}><option value="whatsapp">WhatsApp</option><option value="facebook">Facebook Messenger</option><option value="website">Website / order page</option></select>)}
              <div className="glass-soft p-4 text-sm">
                <p className="font-semibold">Review</p>
                <p className="text-muted">{draft.name || "—"} · {(draft.platforms.join(", ") || "—")} · {draft.frequency} · {draft.publishingMode} · → {draft.salesChannel}</p>
              </div>
            </>)}
          </div>

          {status && <p className="mt-4 text-sm text-muted">{status}</p>}
        </div>

        <div className="actionbar mt-4 flex items-center gap-2 p-2.5">
          {step > 0
            ? <button onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-2 text-sm text-white/80">← Back</button>
            : <span className="px-2 text-xs text-white/50">Step {step + 1}/5</span>}
          {step < 4
            ? <button onClick={() => setStep(step + 1)} className="btn-primary ml-auto">Continue →</button>
            : <button onClick={submit} className="btn-primary ml-auto">Finish setup ✨</button>}
        </div>
      </div>
    </main>
  );
}
