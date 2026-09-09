import { supabaseServer } from "./supabase-server";
import { supabaseAdmin } from "./supabase-admin";

export type AdminSession = {
  userId: string;
  email: string;
  role: "admin" | "portaria";
};

/**
 * Confere se quem está chamando a rota tem uma sessão de admin válida
 * (login feito via Supabase Auth) e retorna o papel dele. Lança erro se
 * não estiver logado ou não tiver perfil de admin cadastrado.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role as "admin" | "portaria",
  };
}
