"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { EVENT } from "@/lib/event";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
          <b style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{EVENT.name}</b>
          <span style={{ fontSize: 10, letterSpacing: 4, color: "var(--red)", fontWeight: 700, marginTop: 2 }}>
            PAINEL ADMIN
          </span>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="field">
          <label>E-mail</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="voce@bailedoscrias.com"
          />
        </div>
        <div className="field">
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="••••••••"
          />
        </div>
        <button className="btn btn-primary btn-block" onClick={login} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="hint-box">
          Acesso restrito à organização do evento. Os administradores são cadastrados
          diretamente no Supabase (tabela <code>admin_profiles</code>) — veja o guia de
          configuração.
        </div>
      </div>
    </div>
  );
}
