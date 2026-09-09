"use client";

import { useState } from "react";
import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import { fmtBRL, fmtDate } from "@/lib/format";

type TicketRow = {
  id: string;
  ticket_code: string;
  lot_name: string;
  buyer_name: string;
  price_paid_cents: number;
  checkin_status: "pendente" | "realizado";
  created_at: string;
};

export default function MeusIngressosPage() {
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (query.trim().length < 3) return;
    setLoading(true);
    const res = await fetch(`/api/tickets/lookup?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setLoading(false);
  }

  return (
    <>
      <PublicNav active="meus-ingressos" />
      <section className="section wrap" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div className="section-kicker">MEUS INGRESSOS</div>
          <h2 className="section-title">Encontre seus ingressos</h2>
          <p className="section-desc">
            Digite o e-mail ou CPF usado na compra.
          </p>
        </div>

        <div className="panel" style={{ maxWidth: 460, display: "flex", gap: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="seuemail@exemplo.com ou CPF"
            style={{
              flex: 1,
              background: "var(--bg-alt)",
              border: "1px solid var(--border)",
              color: "var(--white)",
              padding: "12px 14px",
              borderRadius: 2,
            }}
          />
          <button className="btn btn-primary" onClick={search} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {tickets && tickets.length === 0 && (
          <div className="empty-state">
            <div className="big">Nenhum ingresso encontrado</div>
            <p>Confira se digitou o e-mail ou CPF exatamente como na compra.</p>
          </div>
        )}

        {tickets && tickets.length > 0 && (
          <div className="tickets-list" style={{ marginTop: 30 }}>
            {tickets.map((t) => (
              <div key={t.id} className="ticket">
                <div className="ticket-head">
                  <b>{t.buyer_name}</b>
                  <span>{t.lot_name.toUpperCase()}</span>
                </div>
                <div className="ticket-body">
                  <div>
                    <div className="tf">VALOR</div>
                    <div className="tv">{fmtBRL(t.price_paid_cents)}</div>
                  </div>
                  <div>
                    <div className="tf">COMPRA</div>
                    <div className="tv">{fmtDate(t.created_at)}</div>
                  </div>
                </div>
                <div className="ticket-code">{t.ticket_code}</div>
                <div className={`ticket-foot ${t.checkin_status === "realizado" ? "used" : ""}`}>
                  {t.checkin_status === "realizado" ? "Check-in já realizado" : "Válido para entrada"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
