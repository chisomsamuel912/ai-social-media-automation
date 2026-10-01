import { adaptMany } from "./adapters";
import { getProvider, type ContentIdea, type Platform, type Variant } from "./provider";

export const MVP_ENGINE_PLATFORMS = ["whatsapp", "facebook"] as Platform[];

export function normalizeKey(topic: string, angle: string): string {
  return `${topic} ${angle}`.toLowerCase().replace(/[^a-z0-9\s₦]/g, "").replace(/\s+/g, " ").trim();
}

/** Drop ideas repeating a topic+angle already in history (30d window enforced by query). */
export function dedupeIdeas(
  ideas: ContentIdea[],
  historyKeys: string[]
): { fresh: ContentIdea[]; blocked: number } {
  const seen = new Set(historyKeys);
  const fresh: ContentIdea[] = [];
  let blocked = 0;
  for (const idea of ideas) {
    const k = normalizeKey(idea.topic, idea.angle);
    if (seen.has(k)) { blocked += 1; continue; }
    seen.add(k);
    fresh.push(idea);
  }
  return { fresh, blocked };
}

/** Cap promo pillar at 40%: demote excess promos to value. */
export function enforceRotation(ideas: ContentIdea[]): ContentIdea[] {
  const maxPromo = Math.floor(ideas.length * 0.4);
  let promoSeen = 0;
  return ideas.map((idea) => {
    if (idea.pillar !== "promo") return idea;
    promoSeen += 1;
    return promoSeen > maxPromo ? { ...idea, pillar: "value" as const } : idea;
  });
}

const CLAIM_PATTERNS = [/₦|\$|€|£/, /pric/i, /discount/i, /%[\s-]*off/i, /\bfree\b/i, /deliver/i, /guarantee/i, /in stock/i, /available/i];

/**
 * Promo-guard: promo content making concrete claims with zero verified facts
 * must show MissingInfoBanner instead of publishing copy. Never invent facts.
 */
export function promoGuard(caption: string, pillar: string, factCount: number): { needsInfo: boolean } {
  if (pillar !== "promo") return { needsInfo: false };
  if (factCount > 0) return { needsInfo: false };
  const hit = CLAIM_PATTERNS.some((re) => re.test(caption));
  return { needsInfo: hit };
}

export interface PlannedIdea extends ContentIdea {
  variants: Variant[];
  needsInfo: boolean;
}

export async function planContent(args: {
  businessName: string;
  guide?: string;
  count?: number;
  platforms?: Platform[];
  salesChannel?: string;
  historyKeys?: string[];
  factCount?: number;
}): Promise<{ ideas: PlannedIdea[]; blocked: number }> {
  const count = Math.min(Math.max(args.count ?? 5, 1), 7);
  const platforms = args.platforms ?? MVP_ENGINE_PLATFORMS;
  const provider = getProvider();
  const raw = await provider.plan({ businessName: args.businessName, guide: args.guide, count });
  const rotated = enforceRotation(raw);
  const { fresh, blocked } = dedupeIdeas(rotated, args.historyKeys ?? []);
  const ideas: PlannedIdea[] = [];
  for (const idea of fresh) {
    const variants: Variant[] = [];
    for (const p of platforms) {
      variants.push(await provider.generate(idea, p));
    }
    const styled = adaptMany(variants, args.salesChannel);
    const caption = styled.map((v) => v.caption).join("\n");
    ideas.push({ ...idea, variants: styled, needsInfo: promoGuard(caption, idea.pillar, args.factCount ?? 0).needsInfo });
  }
  return { ideas, blocked };
}
