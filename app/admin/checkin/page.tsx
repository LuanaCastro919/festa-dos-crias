import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";
import CheckinClient from "@/components/CheckinClient";

export default async function AdminCheckinPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell active="checkin" userEmail={user.email ?? undefined}>
      <CheckinClient />
    </AdminShell>
  );
}
