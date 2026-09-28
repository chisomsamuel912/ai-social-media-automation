import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/provider";

export async function GET() {
  return NextResponse.json({
    ok: true,
    phase: "2-foundations",
    provider: getProvider().name,
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ),
    time: new Date().toISOString()
  });
}
