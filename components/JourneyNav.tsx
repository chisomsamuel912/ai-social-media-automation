"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import SessionChip from "./SessionChip";

// Beginner test version: only the 3 steps a new owner needs.
// Messages + Growth live behind home + attention banners until there's something to see.
const STEPS = [
  { href: "/onboarding", label: "1 · Setup", match: ["/onboarding", "/brand"] },
  { href: "/autopilot", label: "2 · Posts", match: ["/autopilot", "/create", "/review"] },
  { href: "/schedule", label: "3 · My posts", match: ["/schedule", "/customers", "/results"] }
];

/** One connected journey on every screen: Setup → Posts → My posts → Messages → Growth. */
export default function JourneyNav() {
  const path = usePathname();
  const [done, setDone] = useState({ setup: false, planned: false, posted: false });

  useEffect(() => {
    try {
      const queue = JSON.parse(localStorage.getItem("schedule-queue") ?? "[]") as Array<{ status: string }>;
      setDone({
        setup: Boolean(localStorage.getItem("business-id")),
        planned: queue.length > 0,
        posted: queue.some((q) => q.status === "published")
      });
    } catch {}
  }, [path]);

  if (path === "/login") return null;

  const checkFor = (href: string) =>
    href === "/onboarding" ? done.setup : href === "/autopilot" ? done.planned : href === "/schedule" ? done.posted : false;

  return (
    <header className="sticky top-0 z-20 border-b" style={{ background: "rgba(244,242,237,.9)", backdropFilter: "blur(10px)", borderColor: "#DDD8CC" }}>
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2">
        <a href="/" className="serif mr-2 shrink-0 text-lg font-bold">Growpilot</a>
        {STEPS.map((s, i) => {
          const active = s.match.some((m) => path.startsWith(m));
          const isDone = checkFor(s.href);
          return (
            <a key={s.href} href={s.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "text-white" : "text-muted"}`}
              style={active ? { background: "#2B2926" } : { background: "transparent" }}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
                style={{ background: isDone ? "#4A5D4E" : active ? "#fff" : "#D8D2C4", color: isDone || !active ? "#fff" : "#2B2926" }}>
                {isDone ? "✓" : i + 1}
              </span>
              {s.label}
            </a>
          );
        })}
        <span className="ml-auto shrink-0"><SessionChip /></span>
      </div>
    </header>
  );
}
