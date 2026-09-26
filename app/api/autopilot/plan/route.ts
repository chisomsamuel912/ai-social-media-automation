import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit, tooMany } from "@/lib/audit";
import { clientKey, dailyQuota, rateLimit } from "@/lib/ratelimit";
import { planContent } from "@/lib/ai/engine";

const Body = z.object({
  businessId: z.string().uuid().optional(),
  guide: z.string().max(500).optional(),
  count: z.number().int().min(1).max(7).optional()
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`plan:${clientKey(req)}`, 10, 60_000)) return tooMany("Planning is throttled");
  const quota = dailyQuota(`plans:${clientKey(req)}`, 20);
  if (!quota.ok) {
    return NextResponse.json({ error: "daily-quota", hint: `20 plans/day used. Back tomorrow.` }, { status: 429 });
  }
  const { businessId, guide, count } = parsed.data;

  let businessName = "My Business";
  let salesChannel = "whatsapp";
  let historyKeys: string[] = [];
  let factCount = 0;
  const boosts: Record<string, number> = {};

  if (businessId && isSupabaseConfigured()) {
    const db = getServiceClient();
    const biz = await db!.from("businesses").select("name,sales_channels").eq("id", businessId).single();
    if (biz.data) {
      businessName = biz.data.name ?? businessName;
      salesChannel = biz.data.sales_channels?.[0] ?? salesChannel;
    }
    const hist = await db!.from("content_history")
      .select("topic,angle").eq("business_id", businessId)
      .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()).limit(200);
    historyKeys = (hist.data ?? []).map((h: { topic: string; angle: string }) =>
      `${h.topic} ${h.angle}`.toLowerCase().replace(/[^a-z0-9\s₦]/g, "").replace(/\s+/g, " ").trim());
    const facts = await db!.from("verified_facts").select("key", { count: "exact", head: true }).eq("business_id", businessId);
    factCount = facts.count ?? 0;
    const learned = await db!.from("learnings").select("insight_text").eq("business_id", businessId).limit(20);
    for (const row of (learned.data ?? []) as Array<{ insight_text: string }>) {
      const m = row.insight_text.match(/^boost:(.+?) —/);
      if (m) boosts[m[1]] = (boosts[m[1]] ?? 0) + 1;
    }
  }

  const result = await planContent({ businessName, guide, count, salesChannel, historyKeys, factCount, boosts });
  await audit("plan", `planned ${result.ideas.length} ideas`, { businessId: businessId ?? "device" });

  if (businessId && isSupabaseConfigured()) {
    const db = getServiceClient();
    await db!.from("content_history").insert(
      result.ideas.map((i) => ({ business_id: businessId, topic: i.topic, angle: i.angle, hook: "", format: i.format, platform: "multi" }))
    );
  }
  return NextResponse.json({ ok: true, businessName, ...result });
}
