import { NextRequest, NextResponse } from "next/server";
import { clearAdminCache, getAdmin, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { getSupabase } from "@/lib/supabase";

// Remove an admin: they lose access immediately and their login is deleted.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = (await getAdmin())!.email;
  const supabase = getSupabase()!;
  const email = (new URL(req.url).searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Choose who to remove." }, { status: 400 });
  if (email === me) return NextResponse.json({ error: "You cannot remove yourself. Ask another admin to do it." }, { status: 400 });

  const { data: all } = await supabase.from("admins").select("email");
  if ((all ?? []).length <= 1) return NextResponse.json({ error: "You cannot remove the last admin." }, { status: 400 });
  const { data: target } = await supabase.from("admins").select("email").ilike("email", email).maybeSingle();
  if (!target) return NextResponse.json({ error: "That person is not an admin." }, { status: 404 });

  const { error } = await supabase.from("admins").delete().ilike("email", email);
  if (error) return NextResponse.json({ error: "Failed to remove" }, { status: 500 });

  // Also delete their login so a password they already know stops working everywhere. Best effort.
  try {
    let page = 1;
    for (;;) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      const user = data?.users.find((u) => u.email?.toLowerCase() === email);
      if (user) {
        await supabase.auth.admin.deleteUser(user.id);
        break;
      }
      if (!data || data.users.length < 200) break;
      page += 1;
    }
  } catch (err) {
    console.error("Could not delete the removed admin's login:", err);
  }
  clearAdminCache();
  await audit("admin_removed", email);
  return NextResponse.json({ success: true });
}
