import { NextResponse } from "next/server";
import { z } from "zod";
import { renderVisual, type VisualFormat } from "@/lib/templates";

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
  const slides = renderVisual({ ...(parsed.data as { format: VisualFormat; headline: string }), ...parsed.data });
  return NextResponse.json({ ok: true, format: parsed.data.format, slides });
}
