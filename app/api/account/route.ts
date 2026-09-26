import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit } from "@/lib/audit";

const Body = z.object({ businessId: z.string().uuid(), confirm: z.literal("delete-everything") });

/** Privacy: purge a business and everything attached (FK cascades), then client clears device. */
export async function DELETE(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    await audit("account", "device-only delete (supabase offline)");
    return NextResponse.json({ ok: true, mode: "device", hint: "Cleared on this device. Nothing was stored online." });
  }
  const db = getServiceClient();
  const { error } = await db!.from("businesses").delete().eq("id", parsed.data.businessId);
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  await audit("account", "business purged", { businessId: parsed.data.businessId });
  return NextResponse.json({ ok: true, mode: "server" });
}
