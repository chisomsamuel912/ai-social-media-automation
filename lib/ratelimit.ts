/** $0 guards: in-memory sliding windows. No Redis, no paid service. */

const hits = new Map<string, number[]>();
const daily = new Map<string, { day: string; count: number }>();

function prune(key: string, windowMs: number, now: number): number[] {
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, arr);
  return arr;
}

/** True when allowed (and recorded). */
export function rateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const arr = prune(key, windowMs, now);
  if (arr.length >= limit) return false;
  arr.push(now);
  return true;
}

/** Daily quota, e.g. plans/day. Resets at UTC midnight. */
export function dailyQuota(key: string, limit: number, now: Date = new Date()): { ok: boolean; used: number } {
  const day = now.toISOString().slice(0, 10);
  const cur = daily.get(key);
  const used = cur && cur.day === day ? cur.count : 0;
  if (used >= limit) return { ok: false, used };
  daily.set(key, { day, count: used + 1 });
  return { ok: true, used: used + 1 };
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
