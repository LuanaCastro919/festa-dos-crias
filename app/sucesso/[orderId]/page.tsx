import PublicNav from "@/components/PublicNav";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateTicketQrDataUrl } from "@/lib/tickets";
import { fmtBRL } from "@/lib/format";
import { EVENT } from "@/lib/event";
import Link from "next/link";

export const revalidate = 0;

export default async function SucessoPage({
  params,
}: {
  params: { orderId: string };
}) {
  const db = supabaseAdmin();
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("id", params.orderId)
    .single();

  if (!order || order.status !== "pago") {
    return (
      <>
        <PublicNav />
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
              Pedido não confirmado
            </h2>
            <p style={{ color: "var(--gray)", marginBottom: 24 }}>
              Ainda não encontramos a confirmação de pagamento para este pedido.
            </p>
            <Link href={`/pagamento/${params.orderId}`}>
              <button className="btn btn-primary">Ver status do pagamento</button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { data: tickets } = await db
    .from("tickets")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const ticketsWithQr = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      ...t,
      qrDataUrl: await generateTicketQrDataUrl(t.ticket_code),
    }))
  );

  return (
    <>
      <PublicNav />
      <div className="center-stage" style={{ alignItems: "flex-start", paddingTop: 70 }}>
        <div className="stage-card" style={{ maxWidth: 480 }}>
          <div className="check-badge">✓</div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Ingresso confirmado!
          </h2>
          <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 30 }}>
            {ticketsWithQr.length} ingresso{ticketsWithQr.length > 1 ? "s foram gerados" : " foi gerado"}{" "}
            para {order.buyer_name}.
          </p>

          {ticketsWithQr.map((t) => (
            <div key={t.id} className="ticket" style={{ marginBottom: 22 }}>
              <div className="ticket-head">
                <b>{EVENT.name}</b>
                <span>{EVENT.sub}</span>
              </div>
              <div className="ticket-body">
                <div>
                  <div className="tf">NOME</div>
                  <div className="tv">{t.buyer_name}</div>
                </div>
                <div>
                  <div className="tf">LOTE</div>
                  <div className="tv">{t.lot_name}</div>
                </div>
                <div>
                  <div className="tf">VALOR</div>
                  <div className="tv">{fmtBRL(t.price_paid_cents)}</div>
                </div>
                <div>
                  <div className="tf">DATA DO EVENTO</div>
                  <div className="tv">{EVENT.dateShort}</div>
                </div>
              </div>
              <div className="ticket-qr">
                <div className="qrbox">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.qrDataUrl} alt={`QR do ingresso ${t.ticket_code}`} />
                </div>
              </div>
              <div className="ticket-code">{t.ticket_code}</div>
              <div className="ticket-foot">Apresente este QR Code na entrada</div>
            </div>
          ))}

          <Link href="/meus-ingressos">
            <button className="btn btn-primary btn-block" style={{ marginTop: 6 }}>
              Ver meus ingressos
            </button>
          </Link>
          <Link href="/">
            <button className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
              Voltar ao início
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
