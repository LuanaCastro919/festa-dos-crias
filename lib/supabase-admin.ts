import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a service_role key: só deve ser usado em código que roda
 * no servidor (rotas /api ou Server Components), NUNCA no navegador.
 * Ele ignora as políticas de RLS, então é ele quem faz toda a escrita
 * real no banco (criar pedidos, gerar ingressos, confirmar check-in etc).
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Variáveis do Supabase não configuradas. Confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
