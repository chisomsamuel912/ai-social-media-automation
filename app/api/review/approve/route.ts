import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit } from "@/lib/audit";
import { suggestTimes } from "@/lib/scheduling";

const Body = z.object({ postIds: z.array(z.string().uuid()).min(1).max(20) });

/** YOU approve → AI schedules. Nothing posts without your tap. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  }
  const db = getServiceClient();
  const slots = suggestTimes(parsed.data.postIds.length);
  let n = 0;
  for (let i = 0; i < parsed.data.postIds.length; i++) {
    const { error } = await db!
      .from("posts")
      .update({ status: "scheduled", scheduled_at: slots[i] })
      .eq("id", parsed.data.postIds[i])
      .eq("status", "needs-review");
    if (!error) n += 1;
  }
  await audit("review", `approved ${n} posts`);
  return NextResponse.json({ ok: true, scheduled: n });
}
