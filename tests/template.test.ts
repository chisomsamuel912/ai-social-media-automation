import { describe, expect, it } from "vitest";
import { templateProvider } from "../lib/ai/provider";

describe("templateProvider ($0, zero keys)", () => {
  it("plans N ideas with rotation pillars", async () => {
    const ideas = await templateProvider.plan({ businessName: "TestCo", count: 5 });
    expect(ideas).toHaveLength(5);
    expect(ideas.filter((i) => i.pillar === "promo").length).toBeLessThanOrEqual(2);
  });
  it("generates a tiktok variant with script", async () => {
    const [idea] = await templateProvider.plan({ businessName: "TestCo", count: 1 });
    const v = await templateProvider.generate(idea, "tiktok");
    expect(v.caption.length).toBeGreaterThan(0);
    expect(v.script).toBeDefined();
  });
});
