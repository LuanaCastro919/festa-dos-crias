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

const STATUS_OPTIONS = ["ativo", "aguardando", "esgotado", "encerrado"];

export default function LotesClient() {
  const [lots, setLots] = useState<Lot[] | null>(null);
  const [editing, setEditing] = useState<Record<number, { price: string; status: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/lots");
    const data = await res.json();
    setLots(data.lots ?? []);
    const initial: Record<number, { price: string; status: string }> = {};
    (data.lots ?? []).forEach((l: Lot) => {
      initial[l.id] = { price: (l.price_cents / 100).toFixed(2), status: l.status };
    });
    setEditing(initial);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(id: number) {
    setSaving(id);
    setMsg(null);
    const edit = editing[id];
    const priceCents = Math.round(parseFloat(edit.price.replace(",", ".")) * 100);
    const res = await fetch("/api/admin/lots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, priceCents, status: edit.status }),
    });
    if (res.ok) {
      setMsg("Lote atualizado.");
      await load();
    } else {
      const data = await res.json();
      setMsg(data.error || "Falha ao salvar.");
    }
    setSaving(null);
  }

  if (!lots) {
    return (
      <>
        <div className="admin-topbar">
          <div className="admin-title">Lotes</div>
        </div>
        <p style={{ color: "var(--gray)" }}>Carregando...</p>
      </>
    );
  }

  return (
    <>
      <div className="admin-topbar">
        <div className="admin-title">Lotes</div>
      </div>
      {msg && (
        <div className="panel" style={{ padding: 14, fontSize: 13, color: "var(--gray)" }}>
          {msg}
        </div>
      )}
      <div className="panel">
        <div className="table-scroll">
          <table className="lots-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Preço (R$)</th>
                <th>Vendidos / Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lots.map((l) => (
                <tr key={l.id}>
                  <td>{l.name}</td>
                  <td>
                    <input
                      value={editing[l.id]?.price ?? ""}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [l.id]: { ...prev[l.id], price: e.target.value },
                        }))
                      }
                      style={{
                        width: 100,
                        background: "var(--bg-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--white)",
                        padding: "8px 10px",
                        borderRadius: 2,
                      }}
                    />
                  </td>
                  <td>
                    {l.sold} / {l.quantity}
                  </td>
                  <td>
                    <select
                      value={editing[l.id]?.status ?? l.status}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          [l.id]: { ...prev[l.id], status: e.target.value },
                        }))
                      }
                      style={{
                        background: "var(--bg-alt)",
                        border: "1px solid var(--border)",
                        color: "var(--white)",
                        padding: "8px 10px",
                        borderRadius: 2,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => save(l.id)}
                      disabled={saving === l.id}
                    >
                      {saving === l.id ? "Salvando..." : "Salvar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--gray-dim)" }}>
        Preço atual de cada lote: {lots.map((l) => `${l.name} ${fmtBRL(l.price_cents)}`).join(" · ")}
      </p>
    </>
  );
}
