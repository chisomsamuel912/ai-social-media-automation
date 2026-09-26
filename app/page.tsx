const sections = [
  { href: "/onboarding", icon: "📝", label: "Onboarding", desc: "5-step setup · live", live: true },
  { href: "/brand", icon: "🎨", label: "Brand", desc: "Identity, media, facts · live", live: true },
  { href: "/autopilot", icon: "🤖", label: "Auto Pilot", desc: "Current plan + Guide Me", live: false },
  { href: "/create", icon: "✨", label: "Create", desc: "Freeform prompt → preview", live: false },
  { href: "/schedule", icon: "📅", label: "Schedule", desc: "Upcoming + reschedule", live: false },
  { href: "/customers", icon: "💬", label: "Customers", desc: "Comments, leads, follow-ups", live: false },
  { href: "/results", icon: "📊", label: "Results", desc: "Metrics + AI learnings", live: false }
];

export default function Page() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-sm text-muted">Phase 2 · Foundations · $0 MVP skeleton</p>
        <h1 className="mt-2 text-4xl">Growpilot dashboard shell</h1>
        <p className="mt-2 text-muted">
          Give the AI direction once. Let it handle the content work. Routes below are
          placeholders wired in the next phases.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <a key={s.href} href={s.live ? s.href : "#"} className="rounded-2xl border bg-card p-4" style={{ borderColor: "#E3DED2" }}>
              <p className="font-semibold">
                {s.icon} {s.label}
              </p>
              <p className="text-sm text-muted">{s.desc}</p>
              <p className="mt-1 font-mono text-xs text-muted">{s.href}{s.live ? "" : " → coming soon"}</p>
            </a>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-muted">
          Health: <a className="underline" href="/api/health">/api/health</a> · Provider: template (zero keys)
        </p>
      </div>
    </main>
  );
}
