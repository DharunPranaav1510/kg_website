import { createdByRequest, findAuthUser } from "@/lib/auth-users";
import { exactLike } from "@/lib/like";
import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { isOwner, OWNER_EMAIL } from "@/lib/owner";
import { getSupabase } from "@/lib/supabase";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function GET() {
  const denied = await requireOwner();
  if (denied) return denied;
  const { data, error } = await getSupabase()!.from("admins").select("email").order("email");
  if (error) return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  return NextResponse.json({ owner: OWNER_EMAIL, admins: (data ?? []).map((a) => a.email) });
}

export async function POST(req: NextRequest) {
  const denied = await requireOwner();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  const supabase = getSupabase()!;
  // A password is only needed for someone who has no login yet.
  let created = false;
  // A login made through the public request form was set up by whoever typed it, who may not own
  // that email. It becomes an admin only by approving its request, never from here.
  const existingUser = await findAuthUser(email);
  if (existingUser && password) {
    return NextResponse.json({ error: "This email already has a login, so a new password cannot be set here. Choose \"This person already has a login\"." }, { status: 409 });
  }
  if (createdByRequest(existingUser)) {
    return NextResponse.json({ error: "This login was created from an access request. Approve it under \"Waiting for your approval\" instead." }, { status: 409 });
  }
  if (password) {
    if (password.length < 10) return NextResponse.json({ error: "Use a password of at least 10 characters." }, { status: 400 });
    const { error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error && !/already|registered|exists/i.test(error.message)) {
      return NextResponse.json({ error: "Could not create the login.", detail: error.message }, { status: 400 });
    }
    created = !error;
  }

  const { error } = await supabase.from("admins").upsert({ email });
  if (error) return NextResponse.json({ error: "Failed to add admin" }, { status: 500 });
  await audit("admin_added", email, { loginCreated: created });
  return NextResponse.json({ success: true, email, loginCreated: created });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireOwner();
  if (denied) return denied;

  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  if (isOwner(email)) return NextResponse.json({ error: "The owner cannot be removed." }, { status: 400 });

  const { error } = await getSupabase()!.from("admins").delete().ilike("email", exactLike(email));
  if (error) return NextResponse.json({ error: "Failed to remove admin" }, { status: 500 });
  await audit("admin_removed", email);
  return NextResponse.json({ success: true });
}
