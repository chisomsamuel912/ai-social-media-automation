import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const Body = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  products: z.string().default(""),
  audience: z.string().default(""),
  location: z.string().default(""),
  tone: z.string().default("friendly"),
  topics: z.string().default(""),
  avoidTopics: z.string().default(""),
  goals: z.string().default(""),
  platforms: z.array(z.string()).default(["whatsapp", "facebook"]),
  frequency: z.string().default("let_ai_decide"),
  publishingMode: z.string().default("remind_me"),
  salesChannel: z.string().default("whatsapp")
});

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "supabase-not-configured", hint: "Add Supabase keys to .env, then retry." },
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

  const { data: biz, error: bizErr } = await db
    .from("businesses")
    .insert({
      name: b.name,
      description: b.description,
      sales_channels: [b.salesChannel],
      publishing_mode: b.publishingMode,
      posting_frequency: b.frequency
    })
    .select("id")
    .single();
  if (bizErr || !biz) return NextResponse.json({ error: "db-error", detail: bizErr?.message }, { status: 500 });

  const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  await db.from("content_profiles").insert({
    business_id: biz.id,
    audience_json: { audience: b.audience, location: b.location, platforms: b.platforms },
    tone: b.tone,
    topics: csv(b.topics),
    avoid_topics: csv(b.avoidTopics),
    goals: csv(b.goals)
  });
  await db.from("brands").insert({ business_id: biz.id });
  return NextResponse.json({ ok: true, businessId: biz.id });
}
