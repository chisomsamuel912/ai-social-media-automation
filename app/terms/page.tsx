export default function TermsPage() {
  return (
    <main className="stage px-4 py-10">
      <div className="glass relative mx-auto max-w-xl p-8">
        <h1 className="serif text-3xl">Terms (beta)</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted">
          <p><b>1. Beta tool.</b> Growpilot is a private beta. AI suggestions are drafts — you review and approve everything before it posts anywhere.</p>
          <p><b>2. Your content.</b> Everything you create stays yours. We claim no rights over your posts, photos, or customer conversations.</p>
          <p><b>3. No spam.</b> Automated follow-ups are capped (max 2, ~48h apart) and stop on purchase or opt-out. If you use them, you confirm recipients agreed to be contacted.</p>
          <p><b>4. No guarantees.</b> We don&apos;t promise reach, engagement, or sales — only that the AI will never invent your prices or policies.</p>
          <p><b>5. Free tier limits.</b> The $0 MVP runs on free tiers (Supabase, Vercel). Heavy abuse (rate limits, quotas) may be throttled to protect the service.</p>
          <p><b>6. Leave anytime.</b> Delete your data from the Brand page whenever you like.</p>
        </div>
        <a href="/" className="btn-ghost mt-6 inline-block text-sm">← Home</a>
      </div>
    </main>
  );
}
