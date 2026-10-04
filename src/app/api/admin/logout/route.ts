import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearSessionCookies(res);
  return res;
}
