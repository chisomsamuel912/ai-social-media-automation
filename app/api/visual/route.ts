import { NextResponse } from "next/server";
import { z } from "zod";
import { tooMany } from "@/lib/audit";
import { clientKey, dailyQuota, rateLimit } from "@/lib/ratelimit";
import { renderVisual, type VisualFormat } from "@/lib/templates";
import { generateFreeImage, generateImage } from "@/lib/visual-ai";

const Body = z.object({
  format: z.enum(["image", "carousel", "script"]).default("image"),
  headline: z.string().min(1).max(200),
  subline: z.string().max(200).optional(),
  businessName: z.string().max(80).optional(),
  colors: z.array(z.string()).max(3).optional()
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!rateLimit(`visual:${clientKey(req)}`, 30, 60_000)) return tooMany("Rendering is throttled");
  if (!dailyQuota(`renders:${clientKey(req)}`, 50).ok) {
    return NextResponse.json({ error: "daily-quota", hint: "50 renders/day used. Back tomorrow." }, { status: 429 });
  }
  const slides = renderVisual({ ...(parsed.data as { format: VisualFormat; headline: string }), ...parsed.data });
  // Real AI picture first (free tiers); template slides always included as backup.
  let aiImage: string | null = null;
  if (parsed.data.format === "image") {
    aiImage = await generateImage(parsed.data.headline, parsed.data.businessName);
    if (!aiImage) aiImage = await generateFreeImage(parsed.data.headline, parsed.data.businessName);
  }
  return NextResponse.json({ ok: true, format: parsed.data.format, slides, aiImage });
}
