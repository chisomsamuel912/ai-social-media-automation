import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const Body = z.object({ businessId: z.string().uuid(), autoPlan: z.boolean() });

/** Flip the automation switch for a business. */
export async function PATCH(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "device", hint: "Saved on device; server switch applies once online." });
  }
  const db = getServiceClient();
  const { error } = await db!.from("businesses").update({ auto_plan: parsed.data.autoPlan }).eq("id", parsed.data.businessId);
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, autoPlan: parsed.data.autoPlan });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ autoPlan: true, offline: true });
  const db = getServiceClient();
  const { data } = await db!.from("businesses").select("auto_plan").eq("id", businessId).single();
  return NextResponse.json({ autoPlan: (data?.auto_plan as boolean) ?? true });
}
