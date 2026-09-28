import { NextResponse } from "next/server";
import { z } from "zod";
import { tooMany } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { getProvider, type Platform } from "@/lib/ai/provider";
import { adapt } from "@/lib/ai/adapters";
import { shapePost } from "@/lib/starter";

const Body = z.object({
  business: z.string().min(3).max(200),
  platform: z.enum(["whatsapp", "facebook", "instagram"]).default("whatsapp"),
  count: z.number().int().min(1).max(5).optional()
});

/** Tiny generator: business in → 5 posts out. No login, no database. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`starter:${clientKey(req)}`, 10, 60_000)) return tooMany("Slow down a little and retry.");
  const { business, platform, count } = parsed.data;
  const provider = getProvider();
  const ideas = await provider.plan({ businessName: business, count: count ?? 5 });
  const posts = [];
  for (let i = 0; i < ideas.length; i++) {
    const variant = adapt(await provider.generate(ideas[i], platform as Platform), "whatsapp");
    posts.push(shapePost(ideas[i], variant, platform as Platform, i));
  }
  return NextResponse.json({ ok: true, posts });
}
