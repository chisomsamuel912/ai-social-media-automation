import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const Body = z.object({
  businessId: z.string().uuid().optional(),
  platform: z.string().default(""),
  caption: z.string().default(""),
  views: z.number().int().min(0).default(0),
  likes: z.number().int().min(0).default(0),
  comments: z.number().int().min(0).default(0),
  shares: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0)
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured() || !parsed.data.businessId) {
    return NextResponse.json({ ok: true, stored: false, hint: "Metrics kept on device until Supabase is connected." });
  }
  const db = getServiceClient();
  const { error } = await db!.from("manual_metrics").insert({
    business_id: parsed.data.businessId,
    platform: parsed.data.platform,
    caption: parsed.data.caption.slice(0, 500),
    views: parsed.data.views,
    likes: parsed.data.likes,
    comments: parsed.data.comments,
    shares: parsed.data.shares,
    clicks: parsed.data.clicks
  });
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
