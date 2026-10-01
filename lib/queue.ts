export interface QueueItem {
  key: string;
  topic: string;
  platform: string;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  status: "scheduled" | "published";
}

export function loadQueue(): QueueItem[] {
  try {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("schedule-queue") ?? "[]");
  } catch {
    return [];
  }
}

export function saveQueue(q: QueueItem[]): void {
  try {
    localStorage.setItem("schedule-queue", JSON.stringify(q));
  } catch {}
}
