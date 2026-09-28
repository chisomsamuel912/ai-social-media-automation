import { describe, expect, it } from "vitest";
import { toSimplePost } from "../lib/simple";

describe("toSimplePost", () => {
  it("splits hook from body with platform default CTA", () => {
    const out = toSimplePost("NEPA took light again. Our rechargeable fan keeps you cool all night.", ["#fans"], "whatsapp");
    expect(out.hook).toBe("NEPA took light again.");
    expect(out.caption).toContain("keeps you cool");
    expect(out.cta).toContain("Reply here");
  });
  it("lifts an explicit CTA from the last sentence", () => {
    const out = toSimplePost("Hot night? Stay cool for 12 hours. DM us to order today.", [], "instagram");
    expect(out.cta).toContain("DM us");
    expect(out.caption).not.toContain("DM us");
  });
  it("never returns empty parts", () => {
    const out = toSimplePost("Fans!", [], "tiktok");
    expect(out.hook.length).toBeGreaterThan(0);
    expect(out.caption.length).toBeGreaterThan(0);
    expect(out.cta.length).toBeGreaterThan(0);
  });
});
