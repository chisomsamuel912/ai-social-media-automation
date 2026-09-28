import { describe, expect, it } from "vitest";
import { downloadText, shapePost } from "../lib/starter";
import type { ContentIdea, Variant } from "../lib/ai/provider";

const idea: ContentIdea = { topic: "Weekend sourdough sale", angle: "announcement", format: "Image", pillar: "promo" };
const variant: Variant = {
  platform: "whatsapp" as never,
  caption: "Fresh trays out this Saturday. Soft, warm, and priced for families.",
  hashtags: [],
  script: undefined
};

describe("shapePost", () => {
  it("splits hook from body and maps promo type + CTA", () => {
    const p = shapePost(idea, variant, "whatsapp" as never, 0);
    expect(p.type).toBe("Promotional");
    expect(p.hook).toContain("Fresh trays");
    expect(p.cta).toContain("Reply here");
  });
  it("maps value pillar to Educational", () => {
    const p = shapePost({ ...idea, pillar: "value" }, variant, "facebook", 1);
    expect(p.type).toBe("Educational");
  });
});

describe("downloadText", () => {
  it("renders 5 numbered posts with business header", () => {
    const posts = Array.from({ length: 5 }, (_, i) => shapePost(idea, variant, "whatsapp" as never, i));
    const txt = downloadText(posts, "Ada's Kitchen");
    expect(txt).toContain("Ada's Kitchen");
    expect(txt).toContain("POST 5");
  });
});
