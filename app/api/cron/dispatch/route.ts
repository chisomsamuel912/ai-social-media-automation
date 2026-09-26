import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * $0 dispatch: Vercel Cron (free) or the manual "Check due" button hits this.
 * Online rows due now flip scheduled → reminded (idempotent). Device queue
 * items are highlighted client-side on /schedule. No auto-posting in MVP.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "device", hint: "Supabase offline — /schedule highlights due items on-device." });
  }
  const db = getServiceClient();
  const { data, error } = await db!
    .from("posts")
    .update({ status: "reminded" })
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .select("id");
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode: "server", reminded: data?.length ?? 0 });
}
