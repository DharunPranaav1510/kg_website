import { getAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "logout_everywhere"
  | "mfa_enabled"
  | "mfa_disabled"
  | "shop_open"
  | "shop_closed"
  | "product_created"
  | "product_updated"
  | "product_deleted"
  | "prices_changed"
  | "products_imported"
  | "order_status"
  | "number_blocked"
  | "number_unblocked"
  | "content_changed"
  | "policy_changed"
  | "business_changed";

/**
 * Write a line to the admin activity log. Never throws: a logging problem must
 * not stop the action itself. Pass `email` when there is no session yet (login).
 */
export async function audit(action: AuditAction, target?: string, detail?: unknown, email?: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    const who = email ?? (await getAdmin())?.email ?? "unknown";
    const { error } = await supabase
      .from("admin_audit")
      .insert({ admin_email: who, action, target: target ?? null, detail: detail ?? null });
    if (error) console.error("Audit log write failed:", error.message);
  } catch (e) {
    console.error("Audit log error:", e);
  }
}
