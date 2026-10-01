import { NextResponse } from "next/server";
import { getServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import { audit } from "@/lib/audit";

/** Reject: remove a post awaiting review. History keeps the topic so it isn't repeated. */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId-required" }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "supabase-not-configured" }, { status: 503 });
  const db = getServiceClient();
  await db!.from("post_variants").delete().eq("post_id", postId);
  const { error } = await db!.from("posts").delete().eq("id", postId).eq("status", "needs-review");
  if (error) return NextResponse.json({ error: "db-error", detail: error.message }, { status: 500 });
  await audit("review", "post rejected", { postId });
  return NextResponse.json({ ok: true });
}
