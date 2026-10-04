import { redirect } from "next/navigation";
import { getAdmin, hasRefreshCookie } from "@/lib/admin-auth";
import OrderBoard from "./OrderBoard";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const admin = await getAdmin();
  if (!admin) {
    redirect((await hasRefreshCookie()) ? "/api/admin/refresh" : "/admin/login");
  }
  return <OrderBoard />;
}
