import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await getSupabase()!
    .from("admin_audit")
    .select("id, created_at, admin_email, action, target, detail")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    return NextResponse.json({ error: "Failed to load activity", detail: dbDetail(error) }, { status: 500 });
  }
  return NextResponse.json({ entries: data });
}
