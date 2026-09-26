export interface MetricRow {
  platform: string;
  format?: string;
  views: number;
  likes: number;
  comments: number;
}

export interface Insight {
  text: string;
  change: string;
  boostFormat?: string;
}

const engagement = (r: MetricRow) => r.likes + r.comments;

/** Aggregate by format: total engagement + lift vs average. Pure, no AI call. */
export function analyze(rows: MetricRow[]): Insight[] {
  if (rows.length === 0) return [];
  const byFormat = new Map<string, { eng: number; views: number; n: number }>();
  for (const r of rows) {
    const f = r.format || "Image";
    const cur = byFormat.get(f) ?? { eng: 0, views: 0, n: 0 };
    cur.eng += engagement(r);
    cur.views += r.views;
    cur.n += 1;
    byFormat.set(f, cur);
  }
  const totalEng = (() => { let s = 0; byFormat.forEach((v) => { s += v.eng; }); return s; })();
  const avg = totalEng / byFormat.size;
  const insights: Insight[] = [];
  const ranked: Array<[string, { eng: number; views: number; n: number }]> = [];
  byFormat.forEach((v, k) => ranked.push([k, v]));
  ranked.sort((a, b) => b[1].eng - a[1].eng);
  for (const entry of ranked) {
    const format = entry[0];
    const v = entry[1];
    const lift = avg > 0 ? Math.round(((v.eng - avg) / avg) * 100) : 0;
    if (lift > 10) {
      insights.push({
        text: `${format} posts earn ${lift}% more engagement than your average.`,
        change: `Will plan more ${format} next week.`,
        boostFormat: format
      });
    }
  }
  const plats = new Map<string, number>();
  for (const r of rows) plats.set(r.platform, (plats.get(r.platform) ?? 0) + engagement(r));
  let top: [string, number] | null = null;
  plats.forEach((eng, platform) => {
    if (!top || eng > top[1]) top = [platform, eng];
  });
  if (top && plats.size > 1) {
    insights.push({ text: `${top[0]} drives your best response so far.`, change: "Will prioritize it in scheduling." });
  }
  return insights.slice(0, 4);
}

/** Reorder ideas so boosted formats surface first. */
export function applyBoosts<T extends { format: string }>(ideas: T[], boosts: Record<string, number>): T[] {
  if (Object.keys(boosts).length === 0) return ideas;
  return [...ideas].sort((a, b) => (boosts[b.format] ?? 0) - (boosts[a.format] ?? 0));
}
