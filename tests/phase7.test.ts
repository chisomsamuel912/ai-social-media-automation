import { describe, expect, it } from "vitest";
import { analyze, applyBoosts } from "../lib/learner";
import { fitScore, upcomingHolidays } from "../lib/trends";

describe("learner", () => {
  const rows = [
    { platform: "whatsapp", format: "Short video", views: 1000, likes: 200, comments: 50 },
    { platform: "whatsapp", format: "Short video", views: 800, likes: 160, comments: 40 },
    { platform: "facebook", format: "Image", views: 500, likes: 20, comments: 5 },
    { platform: "facebook", format: "Image", views: 400, likes: 15, comments: 5 }
  ];
  it("spots the winning format with lift", () => {
    const insights = analyze(rows);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].boostFormat).toBe("Short video");
    expect(insights[0].text).toContain("%");
  });
  it("returns empty on no data", () => {
    expect(analyze([])).toEqual([]);
  });
  it("boosts reorder ideas", () => {
    const ideas = [{ format: "Image" }, { format: "Short video" }];
    expect(applyBoosts(ideas, { "Short video": 2 })[0].format).toBe("Short video");
  });
});

describe("trend fit", () => {
  it("scores 5 on full fit, 1 on none", () => {
    expect(fitScore({ niche: true, audience: true, brand: true, timely: true })).toBe(5);
    expect(fitScore({ niche: false, audience: false, brand: false, timely: false })).toBe(1);
  });
  it("finds Christmas within December window", () => {
    const found = upcomingHolidays(new Date("2026-12-10"), 21).map((h) => h.name);
    expect(found).toContain("Christmas");
  });
});
