import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit, tooMany } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { classifyLead, suggestReply, type Fact } from "@/lib/customers";

const Body = z.object({
  businessId: z.string().uuid().optional(),
  handle: z.string().max(80).default(""),
  platform: z.string().max(30).default(""),
  comment: z.string().min(1).max(1000),
  facts: z.array(z.object({ key: z.string(), value: z.string() })).optional()
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`analyze:${clientKey(req)}`, 20, 60_000)) return tooMany("Analysis is throttled");
  const { businessId, handle, platform, comment, facts } = parsed.data;

  let known: Fact[] = facts ?? [];
  if (businessId && isSupabaseConfigured() && !facts) {
    const db = getServiceClient();
    const f = await db!.from("verified_facts").select("key,value").eq("business_id", businessId).limit(50);
    known = (f.data ?? []) as Fact[];
  }

  const lead = classifyLead(comment);
  const reply = suggestReply(comment, known);
  if (lead.isLead) await audit("analyze", `lead ${lead.score} from ${handle || "anon"}`, { businessId: businessId ?? "device" });

  let storedId: string | null = null;
  if (businessId && isSupabaseConfigured()) {
    const db = getServiceClient();
    const ins = await db!.from("inbox_items").insert({
      business_id: businessId,
      handle,
      platform,
      comment_text: comment.slice(0, 1000),
      is_lead: lead.isLead,
      lead_score: lead.score,
      reply_text: reply.text,
      reply_action: reply.action,
      status: lead.isLead ? "lead" : "new"
    }).select("id").single();
    storedId = ins.data?.id ?? null;
  }
  return NextResponse.json({ ok: true, storedId, stored: Boolean(storedId), lead, reply });
}
