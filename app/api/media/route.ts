import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ assets: [], offline: true });
  const db = getServiceClient();
  const { data } = await db!
    .from("media_assets")
    .select("id,url,type,tags")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { businessId, url, type, tags } = body as {
    businessId?: string;
    url?: string;
    type?: string;
    tags?: string[];
  };
  if (!businessId || !url) return NextResponse.json({ error: "businessId-and-url-required" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  }
  const db = getServiceClient();
  const { data, error } = await db!
    .from("media_assets")
    .insert({ business_id: businessId, url, type: type ?? "image", tags: tags ?? [] })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
