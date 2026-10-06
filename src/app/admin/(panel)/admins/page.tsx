import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin-auth";
import { isOwner } from "@/lib/owner";
import AdminsPanel from "./AdminsPanel";

export default async function AdminsPage() {
  if (!isOwner((await getAdmin())?.email)) redirect("/admin");
  return <AdminsPanel />;
}
