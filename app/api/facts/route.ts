import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const Fact = z.object({ businessId: z.string().uuid(), key: z.string().min(1), value: z.string().min(1) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ facts: [], offline: true });
  const db = getServiceClient();
  const { data } = await db!.from("verified_facts").select("key,value").eq("business_id", businessId);
  return NextResponse.json({ facts: data ?? [] });
}

export async function POST(req: Request) {
  const parsed = Fact.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  }
  const db = getServiceClient();
  const { error } = await db!.from("verified_facts").upsert(
    { business_id: parsed.data.businessId, key: parsed.data.key, value: parsed.data.value, source: "owner" },
    { onConflict: "business_id,key" }
  );
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
