import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit } from "@/lib/audit";
import { planContent } from "@/lib/ai/engine";

/**
 * Correct order, every run:
 *  1. AI creates this week's posts for businesses on auto-pilot (status needs-review).
 *  2. Due scheduled posts flip to reminded (your cue to post).
 *  3. YOU approve in /review — nothing publishes without your tap.
 * Vercel Cron (free) or the manual "Check due" button hits this. No auto-posting in MVP.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "device", hint: "Supabase offline — /schedule highlights due items on-device." });
  }
  const db = getServiceClient();
  let autoPlanned = 0;

  const { data: businesses } = await db!
    .from("businesses")
    .select("id,name,sales_channels")
    .eq("auto_plan", true)
    .limit(50);

  for (const biz of (businesses ?? []) as Array<{ id: string; name: string; sales_channels: string[] }>) {
    try {
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const recent = await db!.from("content_ideas")
        .select("id", { count: "exact", head: true })
        .eq("business_id", biz.id)
        .gte("created_at", weekAgo);
      if ((recent.count ?? 1) > 0) continue;

      const hist = await db!.from("content_history")
        .select("topic,angle").eq("business_id", biz.id)
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).limit(200);
      const historyKeys = ((hist.data ?? []) as Array<{ topic: string; angle: string }>).map((h) =>
        `${h.topic} ${h.angle}`.toLowerCase().replace(/[^a-z0-9\s₦]/g, "").replace(/\s+/g, " ").trim());
      const facts = await db!.from("verified_facts").select("key", { count: "exact", head: true }).eq("business_id", biz.id);

      const { ideas } = await planContent({
        businessName: biz.name ?? "My Business",
        count: 2,
        salesChannel: biz.sales_channels?.[0] ?? "whatsapp",
        historyKeys,
        factCount: facts.count ?? 0
      });

      for (const idea of ideas) {
        const ideaRow = await db!.from("content_ideas").insert({
          business_id: biz.id, topic: idea.topic, angle: idea.angle,
          format: idea.format, pillar: idea.pillar, status: "needs-review"
        }).select("id").single();
        if (!ideaRow.data) continue;
        const postRow = await db!.from("posts").insert({
          business_id: biz.id, idea_id: ideaRow.data.id, status: "needs-review"
        }).select("id").single();
        if (!postRow.data) continue;
        await db!.from("post_variants").insert(
          idea.variants.map((v) => ({
            post_id: postRow.data.id, platform: v.platform,
            caption: v.caption, hashtags: v.hashtags, script: v.script ?? "", status: "needs-review"
          }))
        );
        await db!.from("content_history").insert({
          business_id: biz.id, topic: idea.topic, angle: idea.angle,
          hook: "", format: idea.format, platform: "multi"
        });
      }
      autoPlanned += ideas.length;
      await audit("autopilot", `auto-planned ${ideas.length} ideas`, { businessId: biz.id });
    } catch {
      continue;
    }
  }

  const { data, error } = await db!
    .from("posts")
    .update({ status: "reminded" })
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .select("id");
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mode: "server", autoPlanned, reminded: data?.length ?? 0 });
}
