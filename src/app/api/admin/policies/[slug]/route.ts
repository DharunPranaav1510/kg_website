import { NextRequest, NextResponse } from "next/server";
import { getAdmin, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import { DEFAULT_POLICIES } from "@/data/policy-defaults";
import { isPolicySlug, revalidateContent } from "@/lib/content";
import { validatePolicy } from "@/lib/content-schema";
import { dbDetail } from "@/lib/db-error";
import { getSupabase } from "@/lib/supabase";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  if (!isPolicySlug(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = getSupabase()!;
  const [{ data: row, error }, { data: revisions }] = await Promise.all([
    supabase.from("policies").select("title, subtitle, body, updated_at, updated_by").eq("slug", slug).maybeSingle(),
    supabase.from("policy_revisions").select("id, title, subtitle, body, saved_at, saved_by").eq("slug", slug).order("saved_at", { ascending: false }).limit(20),
  ]);
  if (error) return NextResponse.json({ error: "Failed to load", detail: dbDetail(error) }, { status: 500 });
  const d = DEFAULT_POLICIES[slug];
  return NextResponse.json({
    policy: row
      ? { title: row.title, subtitle: row.subtitle ?? "", body: row.body, updatedAt: row.updated_at, updatedBy: row.updated_by }
      : { ...d, updatedAt: null, updatedBy: null },
    defaults: d,
    revisions: revisions ?? [],
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  if (!isPolicySlug(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const checked = validatePolicy(await req.json().catch(() => null));
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });

  const who = (await getAdmin())?.email ?? "unknown";
  const now = new Date().toISOString();
  const supabase = getSupabase()!;
  const { error } = await supabase.from("policies").upsert({ slug, ...checked.value, updated_at: now, updated_by: who });
  if (error) return NextResponse.json({ error: "Failed to save", detail: dbDetail(error) }, { status: 500 });
  await supabase.from("policy_revisions").insert({ slug, ...checked.value, saved_at: now, saved_by: who });
  await audit("policy_changed", slug);
  revalidateContent();
  return NextResponse.json({ success: true, updatedAt: now });
}

// Go back to the built-in text. Earlier versions stay in the history.
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  if (!isPolicySlug(slug)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await getSupabase()!.from("policies").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: "Failed to reset", detail: dbDetail(error) }, { status: 500 });
  await audit("policy_changed", slug, { reset: true });
  revalidateContent();
  return NextResponse.json({ success: true });
}
