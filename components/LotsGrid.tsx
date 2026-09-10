import Link from "next/link";
import { fmtBRL } from "@/lib/format";
import { SERVICE_FEE_CENTS } from "@/lib/event";

type Lot = {
  id: number;
  name: string;
  price_cents: number;
  quantity: number;
  sold: number;
  position: number;
  status: "ativo" | "esgotado" | "aguardando" | "encerrado";
};

export default function LotsGrid({ lots }: { lots: Lot[] }) {
  return (
    <div className="lots-grid">
      {lots.map((lot) => {
        const available = Math.max(lot.quantity - lot.sold, 0);
        const isActive = lot.status === "ativo";
        const isSold = lot.status === "esgotado";
        const isWaiting = lot.status === "aguardando" || lot.status === "encerrado";
        const statusLabel = isActive
          ? available <= 15
            ? "ÚLTIMOS INGRESSOS!"
            : "DISPONÍVEL"
          : isSold
          ? "ESGOTADO"
          : "EM BREVE";

        return (
          <div
            key={lot.id}
            className={`lot-card ${isActive ? "is-active" : ""} ${isSold ? "is-sold" : ""}`}
          >
            <div className="lot-num">{lot.position}</div>
            <div className="lot-name">{lot.name.toUpperCase()}</div>
            <div className="lot-price">{fmtBRL(lot.price_cents)}</div>
            <div style={{ fontSize: 12, color: "var(--gray-dim)", marginTop: -4, marginBottom: 4 }}>
              + {fmtBRL(SERVICE_FEE_CENTS)} (taxa)
            </div>
            <div className={`lot-status ${lot.status}`} style={{ marginBottom: 22 }}>
              {statusLabel}
            </div>
            {isActive && (
              <Link href={`/checkout?lot=${lot.id}`}>
                <button className="btn btn-primary btn-block">Comprar</button>
              </Link>
            )}
            {isSold && (
              <button className="btn btn-outline btn-block" disabled>
                Esgotado
              </button>
            )}
            {isWaiting && (
              <button className="btn btn-outline btn-block" disabled>
                Aguardando lote atual esgotar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
