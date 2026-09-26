import { describe, expect, it } from "vitest";
import { clientKey, dailyQuota, rateLimit } from "../lib/ratelimit";
import { audit } from "../lib/audit";

describe("rateLimit sliding window", () => {
  it("allows up to limit then blocks", () => {
    const k = `t-${Date.now()}-a`;
    expect(rateLimit(k, 2, 60_000)).toBe(true);
    expect(rateLimit(k, 2, 60_000)).toBe(true);
    expect(rateLimit(k, 2, 60_000)).toBe(false);
  });
  it("expires old hits outside window", () => {
    const k = `t-${Date.now()}-b`;
    expect(rateLimit(k, 1, 10, 1000)).toBe(true);
    expect(rateLimit(k, 1, 10, 1005)).toBe(false);
    expect(rateLimit(k, 1, 10, 2000)).toBe(true);
  });
});

describe("dailyQuota", () => {
  it("caps at limit per UTC day then resets next day", () => {
    const k = `q-${Date.now()}`;
    const d1 = new Date("2026-01-05T10:00:00Z");
    expect(dailyQuota(k, 2, d1)).toEqual({ ok: true, used: 1 });
    expect(dailyQuota(k, 2, d1)).toEqual({ ok: true, used: 2 });
    expect(dailyQuota(k, 2, d1).ok).toBe(false);
    expect(dailyQuota(k, 2, new Date("2026-01-06T10:00:00Z"))).toEqual({ ok: true, used: 1 });
  });
});

describe("clientKey", () => {
  it("falls back to local without proxy header", () => {
    expect(clientKey(new Request("http://x/"))).toBe("local");
  });
});

describe("audit", () => {
  it("never throws offline", async () => {
    await expect(audit("test", "hello", { a: 1 })).resolves.toBeUndefined();
  });
});
