import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPagbankSignature } from "@/lib/pagbank";
import { markOrderPaid } from "@/lib/process-payment";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-authenticity-token");

  // No ambiente sandbox o PagBank não envia o header de assinatura (bug
  // conhecido da própria plataforma), então só exigimos a verificação em
  // produção, onde o header realmente é enviado.
  const isProduction = process.env.PAGBANK_ENV === "production";
  if (isProduction && !verifyPagbankSignature(rawBody, signature)) {
    // não é uma notificação legítima do PagBank — descarta
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // a notificação pode vir no formato "pedido" (com charges[]) ou
  // diretamente como o objeto da cobrança — tratamos os dois formatos
  const charge = Array.isArray(payload.charges) ? payload.charges[0] : payload;
  const pagbankOrderId: string | undefined = Array.isArray(payload.charges)
    ? payload.id
    : payload.metadata?.ps_order_id;
  const chargeId: string | undefined = charge?.id;
  const status: string | undefined = charge?.status;

  if (!chargeId || !status) {
    return NextResponse.json({ error: "Payload sem dados de cobrança." }, { status: 400 });
  }

  const db = supabaseAdmin();

  let orderQuery = db.from("orders").select("*").eq("pagbank_charge_id", chargeId);
  const { data: orders } = await orderQuery;
  let order = orders?.[0];

  if (!order && pagbankOrderId) {
    const { data: byOrderId } = await db
      .from("orders")
      .select("*")
      .eq("pagbank_order_id", pagbankOrderId)
      .limit(1);
    order = byOrderId?.[0];
  }

  if (!order) {
    // não conseguimos casar essa notificação com nenhum pedido nosso
    return NextResponse.json({ received: true });
  }

  // idempotência: se já processamos esse pedido como pago, não faz de novo
  if (order.status === "pago") {
    return NextResponse.json({ received: true });
  }

  if (status === "PAID") {
    await markOrderPaid(order.id, order.qty, order.lot_id, charge.paid_at);
  } else if (status === "DECLINED") {
    await db.from("orders").update({ status: "recusado" }).eq("id", order.id);
  }

  return NextResponse.json({ received: true });
}
