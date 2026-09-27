import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/** Review inbox: AI-created posts waiting for YOUR approval. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ items: [], offline: true });
  const db = getServiceClient();
  const { data: posts, error } = await db!
    .from("posts")
    .select("id,idea_id,scheduled_at,content_ideas(topic,angle,format,pillar)")
    .eq("business_id", businessId)
    .eq("status", "needs-review")
    .order("created_at", { ascending: true })
    .limit(20);
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  const items = [];
  for (const p of (posts ?? []) as Array<{
    id: string; idea_id: string | null;
    content_ideas: { topic: string; angle: string; format: string; pillar: string } | Array<{ topic: string; angle: string; format: string; pillar: string }> | null;
  }>) {
    const idea = Array.isArray(p.content_ideas) ? p.content_ideas[0] ?? null : p.content_ideas;
    const { data: variants } = await db!
      .from("post_variants")
      .select("platform,caption,hashtags")
      .eq("post_id", p.id);
    items.push({ postId: p.id, idea, variants: variants ?? [] });
  }
  return NextResponse.json({ items });
}
