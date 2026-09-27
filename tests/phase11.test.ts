import { describe, expect, it } from "vitest";
import { adapt, shorten } from "../lib/ai/adapters";
import type { Variant } from "../lib/ai/provider";

describe("platform voices differ", () => {
  const base: Variant = {
    platform: "whatsapp" as never,
    caption: "Fresh sourdough trays out of the oven this morning, sandwiched with care and baked with love for the whole family #bakery #lagos #fresh",
    hashtags: ["#bakery", "#lagos", "#fresh", "#bread", "#yum", "#morning"]
  };

  it("whatsapp: short, no hashtags, reply CTA", () => {
    const out = adapt({ ...base, platform: "whatsapp" as never });
    expect(out.caption.length).toBeLessThanOrEqual(300 + "\n\nReply here to order 👈".length + 5);
    expect(out.caption).not.toContain("#");
    expect(out.hashtags).toEqual([]);
    expect(out.caption).toContain("Reply here to order");
  });

  it("facebook: keeps hashtags, adds discussion CTA", () => {
    const out = adapt({ ...base, platform: "facebook" }, "website");
    expect(out.hashtags.length).toBeGreaterThan(0);
    expect(out.caption.length).toBeGreaterThan(100);
    expect(/comments|tap the link/i.test(out.caption)).toBe(true);
  });

  it("same idea reads differently per platform", () => {
    const wa = adapt({ ...base, platform: "whatsapp" as never });
    const fb = adapt({ ...base, platform: "facebook" });
    expect(wa.caption).not.toBe(fb.caption);
  });
});

describe("shorten", () => {
  it("cuts at sentence boundary", () => {
    expect(shorten("First sentence here. Second one goes on forever and ever and ever.", 40)).toBe("First sentence here.");
  });
  it("leaves short text alone", () => {
    expect(shorten("Hi there", 300)).toBe("Hi there");
  });
});
