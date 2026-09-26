"use client";
import { useEffect, useState } from "react";
import { followUpDue, nextFollowUp, MAX_FOLLOWUPS, type FollowUpState } from "@/lib/customers";

interface InboxItem extends FollowUpState {
  key: string;
  handle: string;
  platform: string;
  comment: string;
  isLead: boolean;
  score: number;
  reply: string;
  action: "reply" | "escalate";
  createdAt: string;
}

const seed = (): InboxItem[] => {
  try {
    return JSON.parse(localStorage.getItem("customer-inbox") ?? "[]");
  } catch {
    return [];
  }
};

export default function CustomersPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState("whatsapp");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setItems(seed());
    try {
      setBusinessId(localStorage.getItem("business-id") ?? "");
    } catch {}
  }, []);

  function save(list: InboxItem[]) {
    setItems(list);
    try {
      localStorage.setItem("customer-inbox", JSON.stringify(list));
    } catch {}
  }

  async function analyze() {
    if (comment.trim().length < 1) return;
    setBusy(true);
    setMsg("Analyzing…");
    try {
      const res = await fetch("/api/customers/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: businessId || undefined, handle, platform, comment })
      });
      const b = await res.json();
      const item: InboxItem = {
        key: `c-${Date.now()}`,
        handle: handle || "anonymous",
        platform,
        comment,
        isLead: b.lead?.isLead ?? false,
        score: b.lead?.score ?? 0,
        reply: b.reply?.text ?? "",
        action: b.reply?.action ?? "escalate",
        status: b.lead?.isLead ? "lead" : "new",
        followUpCount: 0,
        followUpAt: null,
        createdAt: new Date().toISOString()
      };
      save([item, ...items]);
      setComment("");
      setMsg(b.stored ? "Analyzed + stored ✓" : "Analyzed on-device (Supabase offline).");
    } catch {
      setMsg("Request failed.");
    }
    setBusy(false);
  }

  function update(key: string, patch: Partial<InboxItem>) {
    save(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function scheduleFollowUp(item: InboxItem) {
    if (item.followUpCount >= MAX_FOLLOWUPS) return;
    update(item.key, { followUpAt: nextFollowUp(item.followUpCount), status: "lead" });
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {}
  }

  function remove(key: string) {
    if (confirm("Delete this conversation? (privacy: removes it from this device)")) {
      save(items.filter((i) => i.key !== key));
    }
  }

  const now = new Date();
  const leads = items.filter((i) => i.isLead).length;

  return (
    <main className="stage px-4 py-10">
      <div className="orb" style={{ width: 400, height: 400, left: "-120px", top: "-80px", background: "#9CAF88" }} />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted">💬 Customers · Comments & Leads</p>
        <h1 className="grad-text mt-1 text-center text-4xl">Inbox {items.length > 0 && <span className="text-2xl">· 🔥 {leads} leads</span>}</h1>

        <div className="glass mt-6 p-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="field !border-0 !bg-transparent sm:!w-32" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" />
            <select className="field !border-0 !bg-transparent sm:!w-32" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook</option>
            </select>
            <input className="field !border-0 !bg-transparent" value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Paste a comment… e.g. How much is this?" onKeyDown={(e) => e.key === "Enter" && analyze()} />
            <button onClick={analyze} disabled={busy} className="btn-primary shrink-0">{busy ? "…" : "Analyze"}</button>
          </div>
        </div>
        {msg && <p className="mt-2 text-center text-sm text-muted">{msg}</p>}

        <div className="mt-4 grid gap-3">
          {items.length === 0 && (
            <div className="glass p-8 text-center">
              <p className="serif text-xl">Inbox zero</p>
              <p className="mt-1 text-sm text-muted">Paste a customer comment above. Buying intent gets flagged 🔥, replies draft from verified facts only.</p>
            </div>
          )}
          {items.map((item) => {
            const due = followUpDue(item, now);
            return (
              <div key={item.key} className="glass lift p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <b>{item.handle}</b><span className="text-muted">· {item.platform}</span>
                  {item.isLead && <span className="pill" style={{ background: "#F5EAD3", color: "#7A5C2E", borderColor: "#D9C39A" }}>🔥 lead {Math.round(item.score * 100)}%</span>}
                  <span className="pill">{item.status}</span>
                  {due && <span className="pill" style={{ background: "#E4EAF0", color: "#3D5A73", borderColor: "#BCC9D4" }}>⏰ follow-up due</span>}
                  <button onClick={() => remove(item.key)} className="ml-auto text-xs text-muted underline">delete</button>
                </div>
                <p className="mt-1 text-sm">“{item.comment}”</p>
                {item.action === "reply" ? (
                  <div className="glass-soft mt-2 p-3 text-sm">
                    <p className="text-muted">{item.reply}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => copy(item.reply, item.key)} className="btn-ghost !py-1 text-xs">{copied === item.key ? "Copied ✓" : "📋 Copy reply"}</button>
                      <button onClick={() => update(item.key, { status: "replied" })} className="btn-ghost !py-1 text-xs">Mark replied</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: "#F5EAD3", border: "1px solid #D9C39A" }}>
                    🙋 Needs you — no verified fact covers this. The AI stayed silent rather than inventing an answer.
                    <button onClick={() => update(item.key, { status: "escalated" })} className="btn-ghost ml-2 !py-1 text-xs">Take over</button>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted">Follow-ups: {item.followUpCount}/{MAX_FOLLOWUPS}</span>
                  {item.followUpAt && <span className="text-muted">next: {new Date(item.followUpAt).toLocaleString()}</span>}
                  <div className="ml-auto flex gap-1.5">
                    <button onClick={() => scheduleFollowUp(item)} disabled={item.followUpCount >= MAX_FOLLOWUPS} className="btn-ghost !py-1 text-xs disabled:opacity-40">⏰ Follow up in ~48h</button>
                    <button onClick={() => update(item.key, { status: "purchased" })} className="btn-ghost !py-1 text-xs">Purchased ✓</button>
                    <button onClick={() => update(item.key, { status: "opted-out" })} className="btn-ghost !py-1 text-xs">Opt out</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
