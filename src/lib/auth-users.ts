import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

/** Marks sign-in accounts that a stranger created through the "request admin access" form. */
export const REQUEST_SOURCE = "admin_request";

/** The sign-in account for an email, if any. (Small shop: a few pages of users is plenty.) */
export async function findAuthUser(email: string): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  for (let page = 1; page <= 5; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    const hit = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (users.length < 200) return null;
  }
  return null;
}

export const createdByRequest = (u: User | null) => u?.user_metadata?.via === REQUEST_SOURCE;
