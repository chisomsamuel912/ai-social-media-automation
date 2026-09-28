import { describe, expect, it } from "vitest";
import { extractInlineImage, extractText } from "../lib/ai/gemini";

describe("extractText", () => {
  it("joins parts", () => {
    expect(extractText({ candidates: [{ content: { parts: [{ text: "Hello " }, { text: "world" }] } }] })).toBe("Hello world");
  });
  it("throws on empty", () => {
    expect(() => extractText({ candidates: [] })).toThrow();
  });
});

describe("extractInlineImage", () => {
  it("returns data URI for inline part", () => {
    const uri = extractInlineImage({
      candidates: [{ content: { parts: [{ text: "hi" }, { inlineData: { mimeType: "image/png", data: "AAA" } }] } }]
    });
    expect(uri).toBe("data:image/png;base64,AAA");
  });
  it("returns null when text-only", () => {
    expect(extractInlineImage({ candidates: [{ content: { parts: [{ text: "no pic" }] } }] })).toBeNull();
  });
});
