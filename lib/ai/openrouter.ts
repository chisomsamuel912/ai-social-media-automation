import { templateProvider, type AIProvider, type ContentIdea, type Platform, type Variant } from "./provider";

const API = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "liquid/lfm-2.5-2.6b:free";
const PILLARS = ["value", "engagement", "story", "promo"] as const;

/** Pull a JSON array out of fenced or raw model output. Throws on garbage. */
export function parseIdeas(text: string): ContentIdea[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("no-json-array");
  const arr = JSON.parse(raw.slice(start, end + 1)) as Array<Record<string, unknown>>;
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("empty-ideas");
  return arr.slice(0, 7).map((o) => ({
    topic: String(o.topic ?? "Untitled idea").slice(0, 140),
    angle: String(o.angle ?? "how-to").slice(0, 60),
    format: String(o.format ?? "Image").slice(0, 30),
    pillar: (PILLARS as readonly string[]).includes(String(o.pillar)) ? (o.pillar as ContentIdea["pillar"]) : "value"
  }));
}

export function parseVariant(text: string, platform: Platform): Variant {
  try {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = (fenced ? fenced[1] : text).trim();
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    const o = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const tags = Array.isArray(o.hashtags) ? o.hashtags.map((t) => String(t)).slice(0, 8) : [];
    return {
      platform,
      caption: String(o.caption ?? text).slice(0, 1200),
      hashtags: tags,
      script: typeof o.script === "string" ? o.script.slice(0, 600) : undefined
    };
  } catch {
    return { platform, caption: text.slice(0, 1200), hashtags: [] };
  }
}

async function chat(system: string, user: string, temperature: number): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("missing-key");
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "X-Title": "Growpilot"
    },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature })
  });
  if (!res.ok) throw new Error(`openrouter-${res.status}`);
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("empty-reply");
  return text;
}

/**
 * OpenRouter free-tier provider. Any failure (no key, rate limit, bad model,
 * unparsable output) falls back to the offline template — never crashes.
 */
export const openrouterProvider: AIProvider = {
  name: "openrouter",
  async plan({ businessName, guide, count = 5 }) {
    try {
      const text = await chat(
        "You are a sharp social media strategist for small businesses. Be concrete and sensory: name real details, real numbers, real situations. Never generic filler like 'quality products' or 'best service'. Reply with ONLY a JSON array, no other text.",
        `Business: ${businessName}. ${guide ? `Focus: ${guide}.` : ""} Give ${count} content ideas as JSON: [{"topic":"...","angle":"...","format":"Image|Short video|Carousel|Tips|Story|Poll","pillar":"value|engagement|story|promo"}]. Mix pillars; at most 40% promo. Angles must differ from each other. Topics must sound human and specific, never templated.`
        , 0.85
      );
      return parseIdeas(text).slice(0, count);
    } catch (e) {
      console.error("[openrouter-plan-fallback]", e instanceof Error ? e.message : e);
      return templateProvider.plan({ businessName, guide, count });
    }
  },
  async generate(idea, platform) {
    try {
      const text = await chat(
        "You write thumb-stopping social posts for small businesses. Concrete and human: vivid verbs, real specifics, zero clichés. Reply with ONLY JSON, no other text.",
        `Write a ${platform} post for: "${idea.topic}" (angle: ${idea.angle}, format: ${idea.format}). JSON: {"caption":"...","hashtags":["#a"],"script":"..."}. Caption under 150 words, opens with a hook line that earns the next line. Include script only for video formats.`
        , 0.9
      );
      return parseVariant(text, platform);
    } catch {
      return templateProvider.generate(idea, platform);
    }
  }
};
