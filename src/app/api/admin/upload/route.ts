import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// Vercel rejects request bodies over ~4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const supabase = getSupabase()!;

  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  const ext = TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  }

  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
