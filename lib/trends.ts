export interface Holiday {
  name: string;
  month: number;
  day: number;
}

/** Static calendar ($0 stub — no crawler). Nigeria-relevant + global. */
export const HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", month: 1, day: 1 },
  { name: "Valentine's Day", month: 2, day: 14 },
  { name: "Easter Monday", month: 4, day: 6 },
  { name: "Workers' Day", month: 5, day: 1 },
  { name: "Children's Day", month: 5, day: 27 },
  { name: "Democracy Day", month: 6, day: 12 },
  { name: "Independence Day", month: 10, day: 1 },
  { name: "Black Friday", month: 11, day: 28 },
  { name: "Christmas", month: 12, day: 25 },
  { name: "Boxing Day", month: 12, day: 26 }
];

export function upcomingHolidays(from: Date = new Date(), withinDays = 21): Array<Holiday & { date: string }> {
  const out: Array<Holiday & { date: string }> = [];
  for (const h of HOLIDAYS) {
    for (const year of [from.getFullYear(), from.getFullYear() + 1]) {
      const d = new Date(year, h.month - 1, h.day);
      const diff = Math.round((d.getTime() - from.getTime()) / 864e5);
      if (diff >= 0 && diff <= withinDays) out.push({ ...h, date: d.toDateString() });
    }
  }
  return out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export interface FitChecks {
  niche: boolean;
  audience: boolean;
  brand: boolean;
  timely: boolean;
}

/** 1–5 fit score. Use trend only when ≥4. */
export function fitScore(c: FitChecks): number {
  return 1 + (c.niche ? 1 : 0) + (c.audience ? 1 : 0) + (c.brand ? 1 : 0) + (c.timely ? 1 : 0);
}
