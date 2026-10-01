import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit, tooMany } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  ownerId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  sells: z.string().min(3).max(300),
  customers: z.string().max(300).default(""),
  tone: z.string().max(60).default("Friendly and simple"),
  topics: z.string().max(300).default(""),
  platforms: z.array(z.string()).min(1).max(5).default(["instagram", "facebook"])
});

/** First-time business setup — the main manual step. Everything after is automatic. */
export async function POST(req: Request) {
  if (!rateLimit(`onboarding:${clientKey(req)}`, 5, 60_000)) return tooMany("Setup is throttled");
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "supabase-not-configured", hint: "Database isn't connected yet." },
      { status: 503 }
    );
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid-body", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  const db = getServiceClient();
  if (!db) return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });

  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const { data: biz, error: bizErr } = await db
    .from("businesses")
    .insert({
      owner_id: b.ownerId ?? null,
      name: b.name,
      description: b.sells,
      sales_channels: [],
      publishing_mode: "remind_me",
      posting_frequency: "let_ai_decide"
    })
    .select("id")
    .single();
  if (bizErr || !biz) return NextResponse.json({ error: "db-error", detail: bizErr?.message }, { status: 500 });

  await db.from("content_profiles").insert({
    business_id: biz.id,
    audience_json: { customers: b.customers, platforms: b.platforms },
    tone: b.tone,
    topics: csv(b.topics),
    avoid_topics: [],
    goals: []
  });
  await db.from("brands").insert({ business_id: biz.id });
  await audit("onboarding", "business created", { businessId: biz.id });
  return NextResponse.json({ ok: true, businessId: biz.id });
}
