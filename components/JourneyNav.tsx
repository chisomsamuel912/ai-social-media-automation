"use client";
import { usePathname } from "next/navigation";
import SessionChip from "./SessionChip";

const STEPS = [
  { href: "/onboarding", label: "1 · Setup", match: ["/onboarding"] },
  { href: "/review", label: "2 · Review", match: ["/review"] },
  { href: "/schedule", label: "3 · Posted", match: ["/schedule"] }
];

/** The whole app in three steps. Nothing else in the menu. */
export default function JourneyNav() {
  const path = usePathname();
  if (path === "/login") return null;

  return (
    <header className="sticky top-0 z-20 border-b" style={{ background: "rgba(244,242,237,.9)", backdropFilter: "blur(10px)", borderColor: "#CFDFCF" }}>
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2">
        <a href="/" className="serif mr-2 shrink-0 text-lg font-bold">Growpilot</a>
        {STEPS.map((s) => {
          const active = s.match.some((m) => path.startsWith(m));
          return (
            <a key={s.href} href={s.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${active ? "text-white" : "text-muted"}`}
              style={active ? { background: "#1F2A22" } : { background: "transparent" }}>
              {s.label}
            </a>
          );
        })}
        <span className="ml-auto shrink-0"><SessionChip /></span>
      </div>
    </header>
  );
}
