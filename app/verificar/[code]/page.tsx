import PublicNav from "@/components/PublicNav";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const revalidate = 0;

export default async function VerificarPage({ params }: { params: { code: string } }) {
  const db = supabaseAdmin();
  const { data: ticket } = await db
    .from("tickets")
    .select("ticket_code, checkin_status")
    .eq("ticket_code", params.code.toUpperCase())
    .maybeSingle();

  return (
    <>
      <PublicNav />
      <div className="center-stage">
        <div className="stage-card">
          {ticket ? (
            <>
              <div
                className="check-badge"
                style={
                  ticket.checkin_status === "realizado"
                    ? { borderColor: "var(--gray)", color: "var(--gray)", background: "rgba(255,255,255,.05)" }
                    : {}
                }
              >
                {ticket.checkin_status === "realizado" ? "✓" : "🎟"}
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {ticket.checkin_status === "realizado"
                  ? "Este ingresso já foi utilizado"
                  : "Ingresso autêntico"}
              </h2>
              <p style={{ color: "var(--gray)", fontSize: 13 }}>Código {ticket.ticket_code}</p>
            </>
          ) : (
            <>
              <div className="check-badge" style={{ borderColor: "var(--red)" }}>
                ✕
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Código não encontrado
              </h2>
            </>
          )}
        </div>
      </div>
    </>
  );
}
