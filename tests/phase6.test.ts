import { describe, expect, it } from "vitest";
import { buildCopyPack, queueKey, suggestTime, suggestTimes } from "../lib/scheduling";

describe("suggestTime", () => {
  it("targets 18:30 WAT baseline and staggers 2h per slot", () => {
    const from = new Date("2026-01-05T10:00:00Z");
    const times = suggestTimes(3, from);
    expect(times).toHaveLength(3);
    const hours = times.map((t) => new Date(t).getUTCHours());
    expect(hours[0]).toBe(17); // 18:30 WAT
    expect(hours[1]).toBe(19);
    expect(hours[2]).toBe(21);
  });
  it("rolls to tomorrow when evening passed", () => {
    const from = new Date("2026-01-05T20:00:00Z");
    const t = new Date(suggestTime(0, from));
    expect(t.getUTCDate()).toBe(6);
  });
});

describe("queueKey idempotency", () => {
  it("same input → same key (retry safe)", () => {
    expect(queueKey("Save Money", "whatsapp", "slot1")).toBe(queueKey("SAVE MONEY", "whatsapp", "slot1"));
  });
  it("different platform → different key", () => {
    expect(queueKey("a", "whatsapp", "s")).not.toBe(queueKey("a", "facebook", "s"));
  });
});

describe("buildCopyPack", () => {
  it("includes caption, hashtags and platform", () => {
    const pack = buildCopyPack({
      key: "q-1", topic: "t", platform: "whatsapp",
      caption: "Fresh trays", hashtags: ["#food"],
      scheduledAt: new Date().toISOString(), status: "scheduled"
    });
    expect(pack).toContain("Fresh trays");
    expect(pack).toContain("#food");
    expect(pack).toContain("whatsapp");
  });
});
