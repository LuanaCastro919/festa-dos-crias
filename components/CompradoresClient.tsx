"use client";

import { useEffect, useState } from "react";
import { fmtBRL, fmtDateTime } from "@/lib/format";

type Ticket = {
  id: string;
  ticket_code: string;
  lot_id: number;
  lot_name: string;
  buyer_name: string;
  cpf: string;
  email: string;
  whatsapp: string;
  price_paid_cents: number;
  checkin_status: "pendente" | "realizado";
  checkin_at: string | null;
  created_at: string;
};

export default function CompradoresClient() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [search, setSearch] = useState("");
  const [checkinFilter, setCheckinFilter] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (checkinFilter) params.set("checkinStatus", checkinFilter);
    const res = await fetch(`/api/admin/tickets?${params.toString()}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkinFilter]);

  function exportCsv() {
    if (!tickets) return;
    const header = "Código,Nome,CPF,E-mail,WhatsApp,Lote,Valor,Check-in,Comprado em\n";
    const rows = tickets
      .map((t) =>
        [
          t.ticket_code,
          t.buyer_name,
          t.cpf,
          t.email,
          t.whatsapp,
          t.lot_name,
          (t.price_paid_cents / 100).toFixed(2),
          t.checkin_status,
          new Date(t.created_at).toLocaleString("pt-BR"),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compradores-baile-dos-crias.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="admin-title">Compradores</div>
        <button className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!tickets?.length}>
          Exportar CSV
        </button>
      </div>

      <div className="filters-bar">
        <input
          placeholder="Buscar por nome, CPF ou código"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select value={checkinFilter} onChange={(e) => setCheckinFilter(e.target.value)}>
          <option value="">Todos os check-ins</option>
          <option value="realizado">Check-in realizado</option>
          <option value="pendente">Check-in pendente</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={load}>
          Buscar
        </button>
      </div>

      <div className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>CPF</th>
                <th>Lote</th>
                <th>Valor</th>
                <th>Check-in</th>
                <th>Comprado em</th>
              </tr>
            </thead>
            <tbody>
              {(tickets ?? []).map((t) => (
                <tr key={t.id}>
                  <td>{t.ticket_code}</td>
                  <td>{t.buyer_name}</td>
                  <td>{t.cpf}</td>
                  <td>{t.lot_name}</td>
                  <td>{fmtBRL(t.price_paid_cents)}</td>
                  <td>
                    <span className={`badge ${t.checkin_status === "realizado" ? "checkin-ok" : "checkin-no"}`}>
                      {t.checkin_status === "realizado" ? "FEITO" : "PENDENTE"}
                    </span>
                  </td>
                  <td>{fmtDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tickets && tickets.length === 0 && (
            <p style={{ color: "var(--gray)", padding: 20, textAlign: "center" }}>
              Nenhum ingresso encontrado.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
