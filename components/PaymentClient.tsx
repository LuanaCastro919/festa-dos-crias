"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtBRL } from "@/lib/format";

type OrderData = {
  id: string;
  status: string;
  lotName: string;
  qty: number;
  totalCents: number;
  pixQrText: string;
  pixQrImageUrl: string;
  pixExpiration: string;
};

export default function PaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error || "Pedido não encontrado.");
          return;
        }
        setOrder(data);

        if (data.status === "pago") {
          router.push(`/sucesso/${orderId}`);
          return;
        }
        if (data.status === "recusado" || data.status === "expirado") {
          return; // para o polling, mostra estado final abaixo
        }
        setTimeout(poll, 4000);
      } catch {
        if (!cancelled) setTimeout(poll, 6000);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId, router]);

  if (error) {
    return (
      <div className="center-stage">
        <div className="stage-card">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Ops
          </h2>
          <p style={{ color: "var(--gray)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="center-stage">
        <div className="stage-card">
          <div className="spinner" />
          <p style={{ color: "var(--gray)" }}>Carregando pagamento...</p>
        </div>
      </div>
    );
  }

  if (order.status === "recusado") {
    return (
      <div className="center-stage">
        <div className="stage-card">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Pagamento recusado
          </h2>
          <p style={{ color: "var(--gray)", marginBottom: 24 }}>
            Não foi possível gerar essa cobrança. Tente novamente.
          </p>
          <a href="/ingressos">
            <button className="btn btn-primary">Voltar para ingressos</button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="section wrap" style={{ maxWidth: 480, paddingTop: 56 }}>
      <div className="section-head">
        <div className="section-kicker">PAGAMENTO VIA PIX</div>
        <h2 className="section-title">Escaneie ou copie o código</h2>
        <p className="section-desc">
          {order.lotName} · {order.qty} ingresso{order.qty > 1 ? "s" : ""} ·{" "}
          <b style={{ color: "#fff" }}>{fmtBRL(order.totalCents)}</b>
        </p>
      </div>

      <div className="panel" style={{ textAlign: "center" }}>
        {order.pixQrImageUrl && (
          <div className="ticket-qr" style={{ background: "transparent", padding: 0, marginBottom: 20 }}>
            <div className="qrbox">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={order.pixQrImageUrl} alt="QR Code Pix" width={220} height={220} />
            </div>
          </div>
        )}
        <textarea
          readOnly
          value={order.pixQrText}
          style={{
            width: "100%",
            background: "var(--bg-alt)",
            border: "1px solid var(--border)",
            color: "var(--gray)",
            fontSize: 11,
            padding: 10,
            borderRadius: 2,
            resize: "none",
            height: 70,
          }}
        />
        <button
          className="btn btn-outline btn-block"
          style={{ marginTop: 12 }}
          onClick={() => {
            navigator.clipboard.writeText(order.pixQrText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copiado!" : "Copiar código Pix"}
        </button>

        <div style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div className="spinner" style={{ width: 20, height: 20, margin: 0 }} />
          <span style={{ fontSize: 13, color: "var(--gray)" }}>
            Aguardando confirmação do pagamento...
          </span>
        </div>
        <p style={{ fontSize: 12, color: "var(--gray-dim)", marginTop: 16 }}>
          Assim que o PagBank confirmar, esta página avança automaticamente — não
          precisa recarregar.
        </p>
      </div>
    </section>
  );
}
