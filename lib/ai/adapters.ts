import type { ContentIdea, Platform, Variant } from "./provider";

/** MVP platforms first; others render but are marked "later" in UI. */
export const ENGINE_PLATFORMS: Platform[] = ["whatsapp", "facebook"] as unknown as Platform[];

function stripHashtags(text: string): string {
  return text.replace(/#[\w-]+/g, "").replace(/\s{2,}/g, " ").trim();
}

function takeHashtags(tags: string[], n: number): string[] {
  return tags.slice(0, n);
}

/**
 * Pure style rules per platform. No AI call, no paid service.
 * WhatsApp: short, chatty, zero hashtags, ends with reply CTA.
 * Facebook: conversational, max 3 hashtags.
 * Others: light-touch transforms (full support post-MVP).
 */
export function adapt(v: Variant, salesChannel = "whatsapp"): Variant {
  switch (v.platform) {
    case "whatsapp" as Platform: {
      const body = stripHashtags(v.caption).slice(0, 500);
      const cta = salesChannel === "whatsapp" ? "Reply here to order 👈" : "Tap the link in bio to order 👈";
      return { ...v, caption: `${body}\n\n${cta}`, hashtags: [] };
    }
    case "facebook": {
      return { ...v, hashtags: takeHashtags(v.hashtags, 3) };
    }
    case "instagram": {
      const [first, ...rest] = v.caption.split("\n");
      return { ...v, caption: `${first}\n\n${rest.join("\n")}`.trim(), hashtags: takeHashtags(v.hashtags, 8) };
    }
    default: {
      return { ...v, hashtags: takeHashtags(v.hashtags, 3) };
    }
  }
}

export function adaptMany(variants: Variant[], salesChannel?: string): Variant[] {
  return variants.map((v) => adapt(v, salesChannel));
}
