/** $0 scheduler: pure functions, no job service. Baseline = evenings WAT (UTC+1). */

/** Suggest a time for slot index: today 18:30 WAT + 2h stagger per item. */
export function suggestTime(index: number, from: Date = new Date()): string {
  const base = new Date(from);
  base.setUTCHours(17, 30, 0, 0); // 18:30 WAT
  if (base.getTime() < from.getTime()) base.setUTCDate(base.getUTCDate() + 1);
  base.setUTCHours(base.getUTCHours() + index * 2);
  return base.toISOString();
}

export function suggestTimes(count: number, from?: Date): string[] {
  return Array.from({ length: count }, (_, i) => suggestTime(i, from));
}

/** Idempotency key so retry storms never double-schedule. */
export function queueKey(topic: string, platform: string, slot: string): string {
  const norm = `${topic}|${platform}|${slot}`.toLowerCase().replace(/[^a-z0-9|₦]+/g, "-");
  let hash = 0;
  for (let i = 0; i < norm.length; i++) hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  return `q-${hash.toString(36)}`;
}

export interface QueueItem {
  key: string;
  topic: string;
  platform: string;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  status: "scheduled" | "published";
}

export function buildCopyPack(item: QueueItem): string {
  const tags = item.hashtags.length > 0 ? `\n\n${item.hashtags.join(" ")}` : "";
  const when = new Date(item.scheduledAt).toLocaleString();
  return `${item.caption}${tags}\n\n— scheduled ${when} (${item.platform})`;
}
