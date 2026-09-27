import type { Variant } from "./provider";

function stripHashtags(text: string): string {
  return text.replace(/#[\w-]+/g, "").replace(/\s{2,}/g, " ").trim();
}

function takeHashtags(tags: string[], n: number): string[] {
  return tags.slice(0, n);
}

/** Cut to a chat-friendly length at a sentence boundary. */
export function shorten(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const atSentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (atSentence > max * 0.4) return cut.slice(0, atSentence + 1).trim();
  return `${cut.slice(0, max - 1).trim()}…`;
}

/**
 * Each platform gets its OWN voice — never the same text twice.
 * WhatsApp: short chat message (≤300 chars), zero hashtags, reply CTA.
 * Facebook: fuller story, hashtags kept, comment CTA to spark discussion.
 */
export function adapt(v: Variant, salesChannel = "whatsapp"): Variant {
  if (v.platform === "whatsapp") {
    const body = shorten(stripHashtags(v.caption), 300);
    const cta = salesChannel === "whatsapp" ? "Reply here to order 👈" : "Tap the link in bio to order 👈";
    return { ...v, caption: `${body}\n\n${cta}`, hashtags: [] };
  }
  if (v.platform === "facebook") {
    let caption = v.caption.trim();
    if (!/[?!…]$/.test(caption) && !/comment/i.test(caption)) {
      caption += "\n\nTell us in the comments 👇";
    }
    return { ...v, caption, hashtags: takeHashtags(v.hashtags, 5) };
  }
  if (v.platform === "instagram") {
    const [first, ...rest] = v.caption.split("\n");
    return { ...v, caption: `${first}\n\n${rest.join("\n")}`.trim(), hashtags: takeHashtags(v.hashtags, 8) };
  }
  return { ...v, hashtags: takeHashtags(v.hashtags, 3) };
}

export function adaptMany(variants: Variant[], salesChannel?: string): Variant[] {
  return variants.map((v) => adapt(v, salesChannel));
}
