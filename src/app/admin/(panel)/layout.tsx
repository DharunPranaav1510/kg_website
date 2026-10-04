import { redirect } from "next/navigation";
import { getAdmin, hasRefreshCookie } from "@/lib/admin-auth";
import AdminShell from "../AdminShell";

export const dynamic = "force-dynamic";

// Every admin page except /admin/login lives in this group: one auth check,
// one sidebar for navigation.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) {
    redirect((await hasRefreshCookie()) ? "/api/admin/refresh" : "/admin/login");
  }
  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
