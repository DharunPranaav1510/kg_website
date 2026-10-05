import type { SupabaseClient } from "@supabase/supabase-js";
import { softRateLimit } from "@/lib/guard";

/**
 * Shared (database-backed) rate limit that works across all serverless
 * instances. Returns true when the action is allowed (and counts it), false
 * when the limit is reached. Falls back to an in-memory limit if there is no
 * database configured (local development).
 */
export async function allow(
  supabase: SupabaseClient | null,
  kind: string,
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  if (!supabase) return softRateLimit(`${kind}:${key}`, max, windowMs);
  if (!(await underLimit(supabase, kind, key, max, windowMs))) return false;
  await record(supabase, kind, key);
  return true;
}

/** Read-only check: how many events happened recently? */
export async function underLimit(
  supabase: SupabaseClient | null,
  kind: string,
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  if (!supabase) return true;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("key", key)
    .gte("created_at", since);
  if (error) {
    // Never lock real customers out because the limiter table is missing.
    console.error("Rate limit check failed:", error.message);
    return true;
  }
  return (count ?? 0) < max;
}

export async function record(supabase: SupabaseClient | null, kind: string, key: string) {
  if (!supabase) return;
  const { error } = await supabase.from("rate_events").insert({ kind, key });
  if (error) console.error("Rate limit record failed:", error.message);
  // Housekeeping: now and then, drop events older than two days.
  if (Math.random() < 0.02) {
    await supabase
      .from("rate_events")
      .delete()
      .lt("created_at", new Date(Date.now() - 2 * 86400000).toISOString());
  }
}
