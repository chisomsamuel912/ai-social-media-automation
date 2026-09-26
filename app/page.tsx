const sections = [
  { href: "/onboarding", icon: "📝", label: "Onboarding", desc: "5-step setup · live", live: true },
  { href: "/brand", icon: "🎨", label: "Brand", desc: "Identity, media, facts · live", live: true },
  { href: "/autopilot", icon: "🤖", label: "Auto Pilot", desc: "Current plan + Guide Me · live", live: true },
  { href: "/create", icon: "✨", label: "Create", desc: "Freeform prompt → preview · live", live: true },
  { href: "/schedule", icon: "📅", label: "Schedule", desc: "Upcoming + reschedule · live", live: true },
  { href: "/customers", icon: "💬", label: "Customers", desc: "Comments, leads, follow-ups · live", live: true },
  { href: "/results", icon: "📊", label: "Results", desc: "Metrics + AI learnings · live", live: true }
];

export default function Page() {
  return (
    <main className="stage">
      <div className="orb" style={{ width: 460, height: 460, left: "-140px", top: "-120px", background: "#9CAF88" }} />
      <div className="orb orb-b" style={{ width: 520, height: 520, right: "-160px", top: "10%", background: "#D9CFC0" }} />
      <div className="relative mx-auto max-w-4xl px-6 py-14">
        <p className="text-sm text-muted">Phase 3 · $0 MVP</p>
        <h1 className="grad-text mt-2 text-5xl">Growpilot</h1>
        <p className="mt-2 max-w-xl text-muted">
          Give the AI direction once. Let it handle the content work.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <a key={s.href} href={s.live ? s.href : "#"}
              className={`glass p-5 ${s.live ? "lift" : "opacity-70"}`}>
              <p className="text-lg font-semibold">{s.icon} {s.label}</p>
              <p className="text-sm text-muted">{s.desc}</p>
              <p className="mt-2 font-mono text-xs text-muted">
                {s.live ? `${s.href} →` : `${s.href} · coming soon`}
              </p>
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
