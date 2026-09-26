const sections = [
  { href: "/home", icon: "🏠", label: "Home", desc: "What needs your attention?" },
  { href: "/autopilot", icon: "🤖", label: "Auto Pilot", desc: "Current plan + Guide Me" },
  { href: "/create", icon: "✨", label: "Create", desc: "Freeform prompt → preview" },
  { href: "/schedule", icon: "📅", label: "Schedule", desc: "Upcoming + reschedule" },
  { href: "/customers", icon: "💬", label: "Customers", desc: "Comments, leads, follow-ups" },
  { href: "/results", icon: "📊", label: "Results", desc: "Metrics + AI learnings" },
  { href: "/brand", icon: "🎨", label: "Brand", desc: "Identity, media, facts" }
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
            <div key={s.href} className="rounded-2xl border bg-card p-4" style={{ borderColor: "#E3DED2" }}>
              <p className="font-semibold">
                {s.icon} {s.label}
              </p>
              <p className="text-sm text-muted">{s.desc}</p>
              <p className="mt-1 font-mono text-xs text-muted">{s.href} → coming soon</p>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-muted">
          Health: <a className="underline" href="/api/health">/api/health</a> · Provider: template (zero keys)
        </p>
      </div>
    </main>
  );
}
