import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

let cached: SupabaseClient | null = null;

/** Server-side client (service key). Returns null when env keys are missing. */
export function getServiceClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_KEY as string
  );
  return cached;
}
