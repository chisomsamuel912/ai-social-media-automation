export default function PrivacyPage() {
  return (
    <main className="stage px-4 py-10">
      <div className="glass relative mx-auto max-w-xl p-8">
        <h1 className="serif text-3xl">Privacy</h1>
        <div className="mt-4 grid gap-3 text-sm text-muted">
          <p><b>What we store.</b> Your business profile, brand facts, media links, content history, metrics you enter, and inbox items — in your Supabase project (yours, free tier) once you connect keys. Before that, everything stays in your browser (localStorage) on your device only.</p>
          <p><b>What we never store.</b> No passwords in-app (Supabase Auth), no payment data (no payments in MVP), no unnecessary personal info about your customers — just handles and conversation context you choose to keep.</p>
          <p><b>AI.</b> The template provider runs on-device with zero data leaving. When you add a free AI key later, prompts go to that provider only.</p>
          <p><b>Deletion.</b> Brand page → “Delete my data” purges your business and everything attached, online and on-device. No email required, no waiting period.</p>
          <p><b>Contact.</b> Questions? Use the feedback box on Home — it lands in the app log, nothing else.</p>
        </div>
        <a href="/" className="btn-ghost mt-6 inline-block text-sm">← Home</a>
      </div>
    </main>
  );
}
