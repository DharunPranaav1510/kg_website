import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_POLICIES, POLICY_SLUGS } from "@/data/policy-defaults";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { data } = await getSupabase()!.from("policies").select("slug, title, updated_at, updated_by");
  const rows = new Map((data ?? []).map((r) => [r.slug, r]));
  return NextResponse.json({
    policies: POLICY_SLUGS.map((slug) => ({
      slug,
      title: rows.get(slug)?.title ?? DEFAULT_POLICIES[slug].title,
      updatedAt: rows.get(slug)?.updated_at ?? null,
      updatedBy: rows.get(slug)?.updated_by ?? null,
    })),
  });
}
