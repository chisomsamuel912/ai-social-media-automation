import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ metrics: [], learnings: [], offline: true });
  const db = getServiceClient();
  const [m, l] = await Promise.all([
    db!.from("manual_metrics").select("platform,caption,views,likes,comments,created_at")
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(100),
    db!.from("learnings").select("insight_text,created_at").eq("business_id", businessId)
      .order("created_at", { ascending: false }).limit(10)
  ]);
  return NextResponse.json({ metrics: m.data ?? [], learnings: l.data ?? [] });
}
