import { describe, expect, it } from "vitest";
import { parseIdeas, parseVariant } from "../lib/ai/openrouter";

describe("parseIdeas", () => {
  it("parses fenced JSON and coerces unknown pillars to value", () => {
    const out = parseIdeas('```json\n[{"topic":"Save money","angle":"myth","format":"Carousel","pillar":"promo"},{"topic":"Hi","angle":"x","format":"Image","pillar":"bogus"}]\n```');
    expect(out).toHaveLength(2);
    expect(out[0].pillar).toBe("promo");
    expect(out[1].pillar).toBe("value");
  });
  it("parses raw JSON without fences", () => {
    const out = parseIdeas('[{"topic":"A","angle":"b","format":"Image","pillar":"story"}]');
    expect(out[0].pillar).toBe("story");
  });
  it("throws on garbage so provider falls back to template", () => {
    expect(() => parseIdeas("Sorry, I cannot do that.")).toThrow();
    expect(() => parseIdeas("[]")).toThrow();
  });
});

describe("parseVariant", () => {
  it("parses caption + hashtags JSON", () => {
    const v = parseVariant('{"caption":"Fresh trays today","hashtags":["#food","#lagos"]}', "facebook");
    expect(v.caption).toBe("Fresh trays today");
    expect(v.hashtags).toEqual(["#food", "#lagos"]);
  });
  it("falls back to raw text when JSON is broken", () => {
    const v = parseVariant("Just a plain caption", "whatsapp" as never);
    expect(v.caption).toContain("Just a plain");
  });
});
