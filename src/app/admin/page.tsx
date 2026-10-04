import { redirect } from "next/navigation";
import { getAdmin, hasRefreshCookie } from "@/lib/admin-auth";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) {
    // Access token may just have expired; try the refresh token first.
    redirect((await hasRefreshCookie()) ? "/api/admin/refresh" : "/admin/login");
  }
  return <AdminDashboard email={admin.email} />;
}
