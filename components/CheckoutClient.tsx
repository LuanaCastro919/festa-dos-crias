"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtBRL } from "@/lib/format";
import { SERVICE_FEE_CENTS } from "@/lib/event";

type Lot = {
  id: number;
  name: string;
  price_cents: number;
  quantity: number;
  sold: number;
};

export default function CheckoutClient({ lot }: { lot: Lot }) {
  const router = useRouter();
  const [step, setStep] = useState<"qty" | "form">("qty");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = Math.max(lot.quantity - lot.sold, 0);
  const maxQty = Math.max(1, Math.min(8, available));
  const subtotal = lot.price_cents * qty;
  const total = subtotal + SERVICE_FEE_CENTS;

  async function submit() {
    if (!name.trim() || !cpf.trim() || !email.trim() || !whatsapp.trim()) {
      setError("Preencha todos os campos para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf, email, whatsapp, lotId: lot.id, qty }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível criar o pedido.");
        setLoading(false);
        return;
      }
      router.push(`/pagamento/${data.orderId}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (step === "qty") {
    return (
      <>
        <div className="section-head">
          <div className="section-kicker">
            {lot.name.toUpperCase()} · {fmtBRL(lot.price_cents)}
          </div>
          <h2 className="section-title">Quantos ingressos?</h2>
          <p className="section-desc">
            Todos os ingressos desta compra pertencem ao mesmo lote e têm o mesmo preço.
          </p>
        </div>
        <div className="panel">
          <div className="qty-row" style={{ marginBottom: 26 }}>
            <button
              className="qty-btn"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <div className="qty-val">{qty}</div>
            <button
              className="qty-btn"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            >
              +
            </button>
            <span style={{ color: "var(--gray)", fontSize: 13, marginLeft: 8 }}>
              ingresso{qty > 1 ? "s" : ""}
            </span>
          </div>
          <div className="summary-row">
            <span>Preço atual</span>
            <b>{fmtBRL(lot.price_cents)}</b>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <b>{fmtBRL(subtotal)}</b>
          </div>
          <div className="summary-row">
            <span>Taxa de serviço</span>
            <b>{fmtBRL(SERVICE_FEE_CENTS)}</b>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{fmtBRL(total)}</span>
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 24 }}
            onClick={() => setStep("form")}
            disabled={available <= 0}
          >
            {available <= 0 ? "Lote esgotado" : "Continuar"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="section-head">
        <div className="section-kicker">FINALIZAR COMPRA</div>
        <h2 className="section-title">Seus dados</h2>
      </div>
      <div className="checkout-grid">
        <div>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>Nome completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como está no seu documento"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>CPF</label>
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="field">
              <label>WhatsApp</label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(81) 90000-0000"
              />
            </div>
          </div>
          <div className="field">
            <label>E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <p style={{ fontSize: 12, color: "var(--gray-dim)", marginTop: 10 }}>
            O pagamento é via PIX. Você vai receber um QR Code real — assim que o
            PagBank confirmar o pagamento, seus ingressos são liberados automaticamente.
          </p>
        </div>

        <div className="summary-card">
          <div className="reserve-banner">
            ⏱ O QR Code do PIX vale por 30 minutos.
          </div>
          <div className="summary-row">
            <span>Ingresso</span>
            <b>{lot.name}</b>
          </div>
          <div className="summary-row">
            <span>Quantidade</span>
            <b>{qty}</b>
          </div>
          <div className="summary-row">
            <span>Valor unitário</span>
            <b>{fmtBRL(lot.price_cents)}</b>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <b>{fmtBRL(subtotal)}</b>
          </div>
          <div className="summary-row">
            <span>Taxa de serviço</span>
            <b>{fmtBRL(SERVICE_FEE_CENTS)}</b>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>{fmtBRL(total)}</span>
          </div>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 22 }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Gerando PIX..." : "Gerar PIX e finalizar"}
          </button>
          <button
            className="btn btn-outline btn-block"
            style={{ marginTop: 10 }}
            onClick={() => setStep("qty")}
            disabled={loading}
          >
            Voltar
          </button>
        </div>
      </div>
    </>
  );
}
