import { describe, expect, it } from "vitest";
import { completeness, EMPTY_DRAFT } from "../lib/onboarding";
import { suggestMedia } from "../lib/media";

describe("onboarding completeness", () => {
  it("empty draft scores 20 (platform + channel defaults)", () => {
    expect(completeness(EMPTY_DRAFT)).toBe(20);
  });
  it("full draft scores 100", () => {
    expect(completeness({
      ...EMPTY_DRAFT,
      name: "Ada Kitchen",
      description: "Jollof catering and weekly meal prep in Lagos",
      products: "Party jollof, meal plans",
      audience: "Busy parents 25-40",
      location: "Lagos"
    })).toBe(100);
  });
});

describe("media rule", () => {
  it("prefers real photo for promo when available", () => {
    expect(suggestMedia({ pillar: "promo", hasRealPhoto: true })).toBe("real-photo");
  });
  it("falls back to template for value posts", () => {
    expect(suggestMedia({ pillar: "value", hasRealPhoto: true })).toBe("template");
  });
  it("template when no photo", () => {
    expect(suggestMedia({ pillar: "promo", hasRealPhoto: false })).toBe("template");
  });
});
