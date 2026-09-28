import { NextResponse } from "next/server";
import { z } from "zod";
import { tooMany } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { getProvider, type Platform } from "@/lib/ai/provider";
import { adapt } from "@/lib/ai/adapters";
import { toSimplePost } from "@/lib/simple";

const Body = z.object({
  prompt: z.string().min(3).max(300),
  platform: z.enum(["whatsapp", "facebook", "instagram", "tiktok"]).default("instagram")
});

/** Tiny MVP: what you sell + platform → hook, caption, hashtags, CTA. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`simple:${clientKey(req)}`, 15, 60_000)) return tooMany("Slow down a little");
  const { prompt, platform } = parsed.data;
  const provider = getProvider();
  const variant = await provider.generate(
    { topic: prompt, angle: "promo", format: "Image", pillar: "promo" },
    platform as Platform
  );
  const styled = adapt(variant);
  return NextResponse.json({ ok: true, via: provider.name, ...toSimplePost(styled.caption, styled.hashtags, platform as Platform) });
}
