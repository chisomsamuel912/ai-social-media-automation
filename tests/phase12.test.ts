import { describe, expect, it } from "vitest";
import { buildImagePrompt, generateFreeImage, generateImage } from "../lib/visual-ai";

describe("buildImagePrompt", () => {
  it("includes headline and business, bans text overlay", () => {
    const p = buildImagePrompt("Weekend sourdough sale", "Ada's Kitchen");
    expect(p).toContain("Weekend sourdough sale");
    expect(p).toContain("Ada's Kitchen");
    expect(p).toContain("No text");
  });
  it("skips placeholder business names", () => {
    expect(buildImagePrompt("Hi", "My Business")).not.toContain("My Business");
  });
});

describe("generateImage", () => {
  it("returns null with no token (template fallback)", async () => {
    delete process.env.HF_TOKEN;
    await expect(generateImage("test")).resolves.toBeNull();
  });
  it("free provider is a function (network tested live, not in unit)", () => {
    expect(typeof generateFreeImage).toBe("function");
  });
});
