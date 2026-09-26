import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    phase: "2-foundations",
    provider: process.env.AI_PROVIDER ?? "template",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ),
    time: new Date().toISOString()
  });
}
