export type MediaSuggestion = "real-photo" | "template";

/**
 * $0 rule (no AI call): product/announcement posts should use the business's
 * real photo; educational/value posts get a code-rendered template.
 */
export function suggestMedia(args: { pillar: string; hasRealPhoto: boolean }): MediaSuggestion {
  const promoLike = args.pillar === "promo" || args.pillar === "story";
  if (promoLike && args.hasRealPhoto) return "real-photo";
  return "template";
}
