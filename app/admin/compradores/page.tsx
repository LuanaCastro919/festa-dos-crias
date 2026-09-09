import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";
import CompradoresClient from "@/components/CompradoresClient";

export default async function AdminCompradoresPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell active="compradores" userEmail={user.email ?? undefined}>
      <CompradoresClient />
    </AdminShell>
  );
}
