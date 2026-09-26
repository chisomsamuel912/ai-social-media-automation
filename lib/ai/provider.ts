export type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin";

export interface ContentIdea {
  topic: string;
  angle: string;
  format: string;
  pillar: "value" | "engagement" | "story" | "promo";
}

export interface Variant {
  platform: Platform;
  caption: string;
  hashtags: string[];
  script?: string;
}

export interface AIProvider {
  name: string;
  plan(args: { businessName: string; guide?: string; count?: number }): Promise<ContentIdea[]>;
  generate(idea: ContentIdea, platform: Platform): Promise<Variant>;
}

/** $0 fallback: deterministic, zero keys, works offline. */
export const templateProvider: AIProvider = {
  name: "template",
  async plan({ businessName, guide, count = 5 }) {
    const base: ContentIdea[] = [
      { topic: `3 mistakes ${businessName} customers make`, angle: "myth-bust", format: "Carousel", pillar: "value" },
      { topic: `${businessName} weekly challenge`, angle: "story", format: "Short video", pillar: "engagement" },
      { topic: `Behind the scenes at ${businessName}`, angle: "story", format: "Image", pillar: "story" },
      { topic: `Customer question answered`, angle: "how-to", format: "Tips", pillar: "value" },
      { topic: `New offer spotlight`, angle: "announcement", format: "Image", pillar: "promo" }
    ];
    const extra = guide ? ` (guide: ${guide})` : "";
    return base.slice(0, count).map((i) => ({ ...i, topic: i.topic + extra }));
  },
  async generate(idea, platform) {
    return {
      platform,
      caption: `${idea.topic} — ${idea.angle}. Details in preview.`,
      hashtags: ["#SmallBusiness", "#Growpilot"],
      script: platform === "tiktok" || platform === "youtube" ? "Hook 0-2s · 3 beats · captions on" : undefined
    };
  }
};

export function getProvider(): AIProvider {
  // Free providers (ollama/gemini/groq) plug in here later behind the same interface.
  // Unknown or missing key → template fallback, never crash.
  return templateProvider;
}
