import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";
import DashboardClient from "@/components/DashboardClient";

export default async function AdminDashboardPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell active="dashboard" userEmail={user.email ?? undefined}>
      <DashboardClient />
    </AdminShell>
  );
}
