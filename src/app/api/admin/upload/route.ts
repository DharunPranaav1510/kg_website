import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sniffImageType } from "@/lib/image-sniff";
import { getSupabase } from "@/lib/supabase";

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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  }

  // Trust the file's real bytes, not the type the browser claims.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImageType(bytes);
  if (!kind) {
    return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 400 });
  }

  const path = `${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, bytes, { contentType: kind.mime });
  if (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
