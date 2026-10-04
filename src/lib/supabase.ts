import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = () =>
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

let client: SupabaseClient | null = null;

// Server-only client (uses the service-role/secret key). Never import from client components.
export function getSupabase(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Server-only client for signing admins in (uses the publishable key).
export function getAuthClient(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
