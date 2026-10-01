import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { getProvider, type Platform } from "@/lib/ai/provider";
import { adapt } from "@/lib/ai/adapters";

const EditBody = z.object({ postId: z.string().uuid(), platform: z.string(), caption: z.string().min(1).max(2000) });
const RegenBody = z.object({ postId: z.string().uuid(), platform: z.string(), instruction: z.string().max(300).optional() });

/** Manual edit: owner rewrites the caption. */
export async function PATCH(req: Request) {
  const parsed = EditBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  const db = getServiceClient();
  const { error } = await db!.from("post_variants")
    .update({ caption: parsed.data.caption })
    .eq("post_id", parsed.data.postId)
    .eq("platform", parsed.data.platform);
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** AI Edit / Redo: regenerate one variant, optionally with an instruction. */
export async function POST(req: Request) {
  const parsed = RegenBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  const db = getServiceClient();
  const { data: post } = await db!.from("posts")
    .select("id,content_ideas(topic,angle,format,pillar)")
    .eq("id", parsed.data.postId)
    .single();
  const idea = (post as { content_ideas: { topic: string; angle: string; format: string; pillar: string } | Array<{ topic: string; angle: string; format: string; pillar: string }> | null } | null)?.content_ideas;
  const full = Array.isArray(idea) ? idea[0] : idea;
  if (!full) return NextResponse.json({ error: "idea-not-found" }, { status: 404 });
  const provider = getProvider();
  const topic = parsed.data.instruction ? `${full.topic} (${parsed.data.instruction})` : full.topic;
  const fresh = adapt(
    await provider.generate(
      { topic, angle: full.angle, format: full.format, pillar: full.pillar as "value" | "engagement" | "story" | "promo" },
      parsed.data.platform as Platform
    )
  );
  const { error } = await db!.from("post_variants")
    .update({ caption: fresh.caption, hashtags: fresh.hashtags, script: fresh.script ?? "" })
    .eq("post_id", parsed.data.postId)
    .eq("platform", parsed.data.platform);
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, variant: fresh });
}
