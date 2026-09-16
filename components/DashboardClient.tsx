"use client";

import { useEffect, useState } from "react";
import { fmtBRL } from "@/lib/format";

type Lot = {
  id: number;
  name: string;
  price_cents: number;
  quantity: number;
  sold: number;
  status: string;
};

type DashboardData = {
  lots: Lot[];
  totalSold: number;
  revenueCents: number;
  avgTicketCents: number;
  totalTickets: number;
  totalCheckins: number;
};

type ReconcileResult = {
  checked: number;
  confirmed: number;
  results: { buyerName: string; totalCents: number; result: string }[];
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<ReconcileResult | null>(null);

  function load() {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => {
    load();
  }, []);

  async function reconcile() {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await fetch("/api/admin/reconcile-orders", { method: "POST" });
      const result = await res.json();
      setReconcileResult(result);
      load(); // atualiza os números depois de confirmar pedidos
    } catch {
      setReconcileResult({ checked: 0, confirmed: 0, results: [] });
    }
    setReconciling(false);
  }

  if (!data) {
    return (
      <>
        <div className="admin-topbar">
          <div className="admin-title">Dashboard</div>
        </div>
        <p style={{ color: "var(--gray)" }}>Carregando...</p>
      </>
    );
  }

  const maxSold = Math.max(...data.lots.map((l) => l.sold), 1);

  return (
    <>
      <div className="admin-topbar">
        <div className="admin-title">Dashboard</div>
        <button className="btn btn-outline btn-sm" onClick={reconcile} disabled={reconciling}>
          {reconciling ? "Verificando..." : "Verificar pedidos pendentes"}
        </button>
      </div>

      {reconcileResult && (
        <div className="panel" style={{ fontSize: 13 }}>
          <div className="panel-title">
            Resultado da verificação — {reconcileResult.checked} pedido(s) conferido(s),{" "}
            {reconcileResult.confirmed} confirmado(s) agora
          </div>
          {reconcileResult.results.length === 0 ? (
            <p style={{ color: "var(--gray)" }}>Nenhum pedido pendente encontrado.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Comprador</th>
                    <th>Valor</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {reconcileResult.results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.buyerName}</td>
                      <td>{fmtBRL(r.totalCents)}</td>
                      <td>{r.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="l">TOTAL DE INGRESSOS VENDIDOS</div>
          <div className="n">{data.totalSold.toLocaleString("pt-BR")}</div>
        </div>
        <div className="stat-card">
          <div className="l">FATURAMENTO</div>
          <div className="n red">{fmtBRL(data.revenueCents)}</div>
        </div>
        <div className="stat-card">
          <div className="l">TICKET MÉDIO</div>
          <div className="n">{fmtBRL(data.avgTicketCents)}</div>
        </div>
        <div className="stat-card">
          <div className="l">CHECK-INS</div>
          <div className="n">{data.totalCheckins.toLocaleString("pt-BR")}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Vendas por lote</div>
        <div className="bars">
          {data.lots.map((l) => (
            <div className="bar-row" key={l.id}>
              <div>{l.name}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.round((l.sold / maxSold) * 100)}%` }}
                />
              </div>
              <div style={{ textAlign: "right", color: "var(--gray)" }}>
                {l.sold} · {fmtBRL(l.sold * l.price_cents)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Lotes — visão rápida</div>
        <div className="table-scroll">
          <table className="lots-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Preço</th>
                <th>Total</th>
                <th>Vendidos</th>
                <th>Disponíveis</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.lots.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>{fmtBRL(l.price_cents)}</td>
                  <td>{l.quantity}</td>
                  <td>{l.sold}</td>
                  <td>{Math.max(l.quantity - l.sold, 0)}</td>
                  <td>
                    <span className={`badge ${l.status}`}>{l.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
