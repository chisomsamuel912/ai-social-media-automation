import { describe, expect, it } from "vitest";
import { adapt } from "../lib/ai/adapters";
import { dedupeIdeas, enforceRotation, normalizeKey, planContent, promoGuard } from "../lib/ai/engine";
import type { ContentIdea } from "../lib/ai/provider";

const mk = (topic: string, pillar: ContentIdea["pillar"] = "value"): ContentIdea =>
  ({ topic, angle: "how-to", format: "Image", pillar });

describe("rotation cap (promo ≤40%)", () => {
  it("demotes excess promos on 5 ideas (max 2)", () => {
    const out = enforceRotation([mk("a", "promo"), mk("b", "promo"), mk("c", "promo"), mk("d"), mk("e")]);
    expect(out.filter((i) => i.pillar === "promo")).toHaveLength(2);
  });
});

describe("dedupe", () => {
  it("blocks repeated topic+angle, case-insensitive", () => {
    const { fresh, blocked } = dedupeIdeas([mk("Save Money"), mk("New Drop", "promo")], [normalizeKey("save money", "how-to")]);
    expect(blocked).toBe(1);
    expect(fresh.map((f) => f.topic)).toEqual(["New Drop"]);
  });
});

describe("promo-guard", () => {
  it("flags promo with price claim and zero facts", () => {
    expect(promoGuard("New tray ₦25,000 available now", "promo", 0).needsInfo).toBe(true);
  });
  it("passes promo when facts exist", () => {
    expect(promoGuard("New tray ₦25,000", "promo", 2).needsInfo).toBe(false);
  });
  it("passes non-promo with claims", () => {
    expect(promoGuard("Save ₦5k weekly tips", "value", 0).needsInfo).toBe(false);
  });
  it("flags discount/free/delivery claims", () => {
    for (const c of ["20% off today", "FREE delivery Friday", "Discount ends soon"]) {
      expect(promoGuard(c, "promo", 0).needsInfo).toBe(true);
    }
  });
});

describe("whatsapp adapter", () => {
  it("strips hashtags and appends reply CTA", () => {
    const out = adapt({ platform: "whatsapp", caption: "Fresh trays ready #food #lagos", hashtags: ["#food"] } as never);
    expect(out.hashtags).toEqual([]);
    expect(out.caption).toContain("Reply here to order");
    expect(out.caption).not.toContain("#food");
  });
  it("facebook keeps hashtags and adds discussion CTA", () => {
    const out = adapt({ platform: "facebook", caption: "Hi", hashtags: ["#a", "#b", "#c", "#d", "#e", "#f"] } as never);
    expect(out.hashtags).toHaveLength(5);
    expect(/comments/i.test(out.caption)).toBe(true);
  });
});

describe("planContent end-to-end (template provider)", () => {
  it("returns whatsapp+facebook variants per idea", async () => {
    const { ideas, blocked } = await planContent({ businessName: "TestCo", count: 3 });
    expect(blocked).toBe(0);
    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.variants.map((v) => v.platform).sort()).toEqual(["facebook", "whatsapp"]);
    }
  });
});
