import type { ContentIdea, Platform, Variant } from "./ai/provider";

export type StarterType = "Educational" | "Promotional" | "Engagement" | "Story" | "Customer";

export interface StarterPost {
  id: string;
  type: StarterType;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  platform: Platform;
}

const TYPE_BY_PILLAR: Record<string, StarterType> = {
  value: "Educational",
  promo: "Promotional",
  engagement: "Engagement",
  story: "Story"
};

const CTA_BY_PLATFORM: Record<string, string> = {
  whatsapp: "Reply here to order 👈",
  facebook: "Tell us in the comments 👇",
  instagram: "Link in bio 👆"
};

/** Shape one AI idea + variant into the beginner post card. Pure, tested. */
export function shapePost(idea: ContentIdea, variant: Variant, platform: Platform, index: number): StarterPost {
  const lines = variant.caption.split("\n").map((l: string) => l.trim()).filter(Boolean);
  const first = lines[0] ?? idea.topic;
  const cut = first.search(/[.!?…]\s/);
  const hook = (cut > 20 ? first.slice(0, cut + 1) : first).slice(0, 140);
  const rest = (cut > 20 ? lines.join("\n").slice(cut + 1) : lines.slice(1).join("\n")).trim();
  return {
    id: `${Date.now().toString(36)}-${index}`,
    type: TYPE_BY_PILLAR[idea.pillar] ?? "Customer",
    hook,
    caption: rest || idea.topic,
    hashtags: variant.hashtags,
    cta: CTA_BY_PLATFORM[platform] ?? "Message us today 👈",
    platform
  };
}

export function downloadText(posts: StarterPost[], business: string): string {
  const head = `${business} — 5 posts (made for you, copy & paste anywhere)\n${"=".repeat(50)}\n`;
  return head + posts.map((p, i) =>
    `\nPOST ${i + 1} — ${p.type} (${p.platform})\nHook: ${p.hook}\n${p.caption}\n${p.hashtags.join(" ")}\n${p.cta}\n`
  ).join("\n");
}
