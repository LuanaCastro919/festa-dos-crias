import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";
import LotesClient from "@/components/LotesClient";

export default async function AdminLotesPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell active="lotes" userEmail={user.email ?? undefined}>
      <LotesClient />
    </AdminShell>
  );
}
