import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/** Audit trail: Supabase app_logs when online, console otherwise. Never throws. */
export async function audit(scope: string, message: string, meta: Record<string, unknown> = {}): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await getServiceClient()!.from("app_logs").insert({ level: "info", scope, message, meta });
    } else {
      console.log(`[audit:${scope}] ${message}`, Object.keys(meta).length ? meta : "");
    }
  } catch {}
}

export function tooMany(what: string): NextResponse {
  return NextResponse.json(
    { error: "rate-limited", hint: `${what} — slow down a little and retry.` },
    { status: 429 }
  );
}
