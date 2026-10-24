import { NextRequest, NextResponse } from "next/server";
import { getAdmin, requireOwner } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Does a sign-in account exist for this email? (Small shop: a few pages of users is plenty.) */
async function loginExists(email: string): Promise<boolean> {
  const supabase = getSupabase()!;
  for (let page = 1; page <= 5; page++) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    if (users.some((u) => u.email?.toLowerCase() === email)) return true;
    if (users.length < 200) return false;
  }
  return false;
}

// The owner approves or rejects a request: { action: "approve" | "reject" }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireOwner();
  if (denied) return denied;
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "approve" && action !== "reject") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const supabase = getSupabase()!;
  const { data: request } = await supabase.from("admin_requests").select("id, email, status").eq("id", id).maybeSingle();
  if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (request.status !== "pending") return NextResponse.json({ error: `This request was already ${request.status}.` }, { status: 409 });

  const email = request.email.toLowerCase();
  if (action === "approve") {
    if (!(await loginExists(email))) {
      return NextResponse.json({ error: "No sign-in account exists for this email. Use Add admin and set a temporary password instead." }, { status: 409 });
    }
    const { error } = await supabase.from("admins").upsert({ email });
    if (error) return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }

  const who = (await getAdmin())?.email ?? "unknown";
  const { error } = await supabase
    .from("admin_requests")
    .update({ status: action === "approve" ? "approved" : "rejected", decided_at: new Date().toISOString(), decided_by: who })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to save the decision" }, { status: 500 });

  await audit(action === "approve" ? "admin_request_approved" : "admin_request_rejected", email);
  return NextResponse.json({ success: true });
}
