import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { analyze, type MetricRow } from "@/lib/learner";

const Body = z.object({
  businessId: z.string().uuid().optional(),
  rows: z.array(z.object({
    platform: z.string().default(""),
    format: z.string().optional(),
    views: z.number().min(0).default(0),
    likes: z.number().min(0).default(0),
    comments: z.number().min(0).default(0)
  })).optional()
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  const { businessId, rows } = parsed.data;

  let data: MetricRow[] = rows ?? [];
  if (businessId && isSupabaseConfigured()) {
    const db = getServiceClient();
    const m = await db!.from("manual_metrics").select("platform,views,likes,comments")
      .eq("business_id", businessId).limit(200);
    data = [...data, ...((m.data ?? []) as MetricRow[])];
  }
  const insights = analyze(data);
  if (businessId && isSupabaseConfigured() && insights.length > 0) {
    const db = getServiceClient();
    await db!.from("learnings").insert(
      insights.map((i) => ({
        business_id: businessId,
        insight_text: i.boostFormat ? `boost:${i.boostFormat} — ${i.text}` : i.text,
        confidence: 0.6,
        applied_count: 0
      }))
    );
  }
  return NextResponse.json({ ok: true, insights, stored: Boolean(businessId && isSupabaseConfigured()) });
}
