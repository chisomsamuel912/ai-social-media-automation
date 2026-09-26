import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { clientKey, rateLimit } from "@/lib/ratelimit";

const Body = z.object({
  kind: z.enum(["bug", "idea", "handled"]).default("idea"),
  text: z.string().min(3).max(1000)
});

export async function POST(req: Request) {
  if (!rateLimit(`feedback:${clientKey(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  await audit("feedback", `${parsed.data.kind}: ${parsed.data.text.slice(0, 300)}`);
  return NextResponse.json({ ok: true, thanks: true });
}
