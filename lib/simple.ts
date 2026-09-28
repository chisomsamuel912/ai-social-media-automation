import type { Platform } from "./ai/provider";

const DEFAULT_CTA: Record<string, string> = {
  whatsapp: "Reply here to order 👈",
  facebook: "Tell us in the comments 👇",
  instagram: "Tap the link in bio 👆",
  tiktok: "Follow for more ➕"
};

export interface SimplePost {
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
}

/** Split a generated caption into hook (first sentence) + body, with a platform CTA. Pure, tested. */
export function toSimplePost(caption: string, hashtags: string[], platform: Platform): SimplePost {
  const clean = caption.replace(/\s+/g, " ").trim();
  const m = clean.match(/^(.+?[.!?…])\s+(.+)$/);
  const hook = (m ? m[1] : clean.slice(0, 120)).trim();
  const body = (m ? m[2] : "").trim();
  const sentences = body.split(/(?<=[.!?])\s+/);
  const last = sentences[sentences.length - 1] ?? "";
  const looksLikeCta = /(reply|link in bio|comment|follow|order|tap|dm|message|shop now|buy)/i.test(last);
  const cta = looksLikeCta && sentences.length > 1 ? last.trim() : (DEFAULT_CTA[platform] ?? DEFAULT_CTA.facebook);
  const bodyText = looksLikeCta && sentences.length > 1 ? sentences.slice(0, -1).join(" ").trim() : body;
  return { hook, caption: bodyText || body || clean, hashtags, cta };
}
