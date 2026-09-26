import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { tooMany } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { planContent } from "@/lib/ai/engine";

const Body = z.object({
  businessId: z.string().uuid().optional(),
  prompt: z.string().min(3).max(500)
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`create:${clientKey(req)}`, 10, 60_000)) return tooMany("Creating is throttled");
  const { businessId, prompt } = parsed.data;

  let businessName = "My Business";
  let salesChannel = "whatsapp";
  let factCount = 0;
  if (businessId && isSupabaseConfigured()) {
    const db = getServiceClient();
    const biz = await db!.from("businesses").select("name,sales_channels").eq("id", businessId).single();
    if (biz.data) {
      businessName = biz.data.name ?? businessName;
      salesChannel = biz.data.sales_channels?.[0] ?? salesChannel;
    }
    const facts = await db!.from("verified_facts").select("key", { count: "exact", head: true }).eq("business_id", businessId);
    factCount = facts.count ?? 0;
  }

  const result = await planContent({
    businessName: `${businessName} — ${prompt}`,
    guide: prompt,
    count: 3,
    salesChannel,
    factCount
  });
  return NextResponse.json({ ok: true, businessName, ...result });
}
