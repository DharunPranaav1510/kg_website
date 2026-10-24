import { NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

// The owner's list of people asking for admin access.
export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  const { data, error } = await getSupabase()!
    .from("admin_requests")
    .select("id, created_at, email, name, note, status, decided_at, decided_by")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
