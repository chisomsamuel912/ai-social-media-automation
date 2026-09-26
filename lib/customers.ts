export interface Fact {
  key: string;
  value: string;
}

const LEAD_PATTERNS = [
  /how much/i, /\bprice\b/i, /cost/i, /\bwant\b/i, /\border\b/i, /\bbuy\b/i,
  /interested/i, /deliver/i, /available/i, /i need/i, /send (me|it|details)/i, /dm (me|you)/i, /location/i, /where.*(shop|store|pick)/i
];

const THANKS_PATTERNS = [/\bthanks?\b/i, /\bthank you\b/i, /❤|😍|👏|🔥/, /\bnice\b/i, /\blove\b/i, /\bgreat\b/i, /\bawww\b/i];

/** Keyword intent scoring ($0 — provider classifier plugs in later). */
export function classifyLead(text: string): { isLead: boolean; score: number } {
  const hits = LEAD_PATTERNS.filter((re) => re.test(text)).length;
  const score = Math.min(hits / 2, 1);
  return { isLead: hits >= 1, score: Math.round(score * 100) / 100 };
}

export type ReplyAction = "reply" | "escalate";

export interface ReplySuggestion {
  text: string;
  confidence: number;
  action: ReplyAction;
  reason: string;
}

/**
 * Facts-only RAG: thanks → friendly reply; question overlapping a verified
 * fact → answer quoting it; anything else → escalate, never invent.
 */
export function suggestReply(comment: string, facts: Fact[]): ReplySuggestion {
  if (THANKS_PATTERNS.some((re) => re.test(comment))) {
    return { text: "Thank you so much! 💛 Let us know if you need anything.", confidence: 0.95, action: "reply", reason: "simple thanks" };
  }
  const words = comment.toLowerCase().replace(/[^a-z0-9\s₦]/g, " ").split(/\s+/).filter((w) => w.length > 3);
  let best: Fact | null = null;
  let bestOverlap = 0;
  for (const f of facts) {
    const hay = `${f.key} ${f.value}`.toLowerCase();
    const overlap = words.filter((w) => hay.includes(w)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = f;
    }
  }
  if (best && bestOverlap >= 1) {
    return {
      text: `Great question! ${best.value} — want me to help you order?`,
      confidence: 0.8,
      action: "reply",
      reason: `answered from verified fact "${best.key}"`
    };
  }
  return {
    text: "",
    confidence: 0.3,
    action: "escalate",
    reason: "no verified fact covers this — owner should reply"
  };
}

export interface FollowUpState {
  followUpCount: number;
  followUpAt: string | null;
  status: "new" | "lead" | "replied" | "purchased" | "opted-out" | "escalated";
}

/** Max 2 nudges, 24–72h apart, hard stop on purchase/opt-out. */
export const MAX_FOLLOWUPS = 2;
export const FOLLOWUP_DELAY_HOURS = 48;

export function followUpDue(state: FollowUpState, now: Date = new Date()): boolean {
  if (state.status === "purchased" || state.status === "opted-out") return false;
  if (state.followUpCount >= MAX_FOLLOWUPS) return false;
  if (!state.followUpAt) return false;
  return new Date(state.followUpAt).getTime() <= now.getTime();
}

export function nextFollowUp(count: number, from: Date = new Date()): string {
  return new Date(from.getTime() + FOLLOWUP_DELAY_HOURS * 3600e3 + count * 24 * 3600e3).toISOString();
}
