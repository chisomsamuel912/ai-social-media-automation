import { templateProvider, type AIProvider, type ContentIdea, type Platform, type Variant } from "./provider";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? "gemini-3.8-flash";
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";
const PILLARS = ["value", "engagement", "story", "promo"] as const;

/** Pull assistant text out of a generateContent response. Pure, tested. */
export function extractText(body: unknown): string {
  const b = body as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = b.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("empty-reply");
  return text;
}

/** Pull the first inline image out as a data URI. Null when absent. Pure, tested. */
export function extractInlineImage(body: unknown): string | null {
  const b = body as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> } }> };
  const parts = b.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inlineData?.data) {
      return `data:${p.inlineData.mimeType ?? "image/png"};base64,${p.inlineData.data}`;
    }
  }
  return null;
}

async function generate(model: string, payload: Record<string, unknown>): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("missing-key");
  const res = await fetch(`${BASE}/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`gemini-${res.status}`);
  return res.json();
}

function coerceIdeas(arr: unknown): ContentIdea[] {
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("empty-ideas");
  return arr.slice(0, 7).map((o: Record<string, unknown>) => ({
    topic: String(o.topic ?? "Untitled idea").slice(0, 140),
    angle: String(o.angle ?? "how-to").slice(0, 60),
    format: String(o.format ?? "Image").slice(0, 30),
    pillar: (PILLARS as readonly string[]).includes(String(o.pillar)) ? (o.pillar as ContentIdea["pillar"]) : "value"
  }));
}

function parseIdeas(text: string): ContentIdea[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  return coerceIdeas(JSON.parse(raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1)));
}

/** Gemini text provider. Any failure falls back to template — never crashes. */
export const geminiProvider: AIProvider = {
  name: "gemini",
  async plan({ businessName, guide, count = 5 }) {
    try {
      const body = await generate(TEXT_MODEL, {
        contents: [{
          parts: [{
            text: `You are a sharp social media strategist for small businesses. Be concrete and sensory, never generic. Reply with ONLY a JSON array, no other text.\nBusiness: ${businessName}. ${guide ? `Focus: ${guide}.` : ""} Give ${count} ideas: [{"topic":"...","angle":"...","format":"Image|Short video|Carousel|Tips|Story|Poll","pillar":"value|engagement|story|promo"}]. Mix pillars, max 40% promo, distinct angles, human-sounding topics.`
          }]
        }],
        generationConfig: { temperature: 0.85 }
      });
      return parseIdeas(extractText(body)).slice(0, count);
    } catch (e) {
      console.error("[gemini-plan-fallback]", e instanceof Error ? e.message : e);
      return templateProvider.plan({ businessName, guide, count });
    }
  },
  async generate(idea, platform: Platform) {
    try {
      const body = await generate(TEXT_MODEL, {
        contents: [{
          parts: [{
            text: `You write thumb-stopping social posts. Concrete, human, zero clichés. Reply with ONLY JSON, no other text.\nWrite a ${platform} post for "${idea.topic}" (angle: ${idea.angle}, format: ${idea.format}). JSON: {"caption":"...","hashtags":["#a"],"script":"..."}. Under 150 words, hook first. Script only for video.`
          }]
        }],
        generationConfig: { temperature: 0.9 }
      });
      const text = extractText(body);
      const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const raw = (fenced ? fenced[1] : text).trim();
      const o = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)) as Record<string, unknown>;
      return {
        platform,
        caption: String(o.caption ?? text).slice(0, 1200),
        hashtags: Array.isArray(o.hashtags) ? o.hashtags.map((t) => String(t)).slice(0, 8) : [],
        script: typeof o.script === "string" ? o.script.slice(0, 600) : undefined
      };
    } catch (e) {
      console.error("[gemini-generate-fallback]", e instanceof Error ? e.message : e);
      return templateProvider.generate(idea, platform);
    }
  }
};

/** Gemini picture. Data URI on success, null on throttle/failure. Never throws. */
export async function generateGeminiImage(headline: string): Promise<string | null> {
  try {
    const body = await generate(IMAGE_MODEL, {
      contents: [{
        parts: [{ text: `Photorealistic square social media photo: ${headline}. Warm professional commercial photography, soft light, rich color. No text, no words, no watermark.` }]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    });
    return extractInlineImage(body);
  } catch {
    return null;
  }
}
