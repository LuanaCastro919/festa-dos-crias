import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyPagbankSignature } from "@/lib/pagbank";
import { generateTicketCode } from "@/lib/tickets";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-authenticity-token");

  if (!verifyPagbankSignature(rawBody, signature)) {
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
    const { data: lot } = await db.from("lots").select("*").eq("id", order.lot_id).single();
    if (!lot) {
      return NextResponse.json({ received: true });
    }

    // gera os N ingressos deste pedido, com código único cada um
    const ticketRows = [];
    for (let i = 0; i < order.qty; i++) {
      let code = generateTicketCode();
      // garante unicidade (extremamente raro colidir, mas confere mesmo assim)
      // eslint-disable-next-line no-await-in-loop
      let { data: exists } = await db
        .from("tickets")
        .select("id")
        .eq("ticket_code", code)
        .maybeSingle();
      while (exists) {
        code = generateTicketCode();
        // eslint-disable-next-line no-await-in-loop
        const retry = await db
          .from("tickets")
          .select("id")
          .eq("ticket_code", code)
          .maybeSingle();
        exists = retry.data;
      }

      ticketRows.push({
        order_id: order.id,
        ticket_code: code,
        lot_id: order.lot_id,
        lot_name: lot.name,
        buyer_name: order.buyer_name,
        cpf: order.cpf,
        email: order.email,
        whatsapp: order.whatsapp,
        price_paid_cents: lot.price_cents,
        payment_method: order.payment_method,
      });
    }

    await db.from("tickets").insert(ticketRows);

    await db
      .from("orders")
      .update({ status: "pago", paid_at: charge.paid_at ?? new Date().toISOString() })
      .eq("id", order.id);

    const newSold = lot.sold + order.qty;
    await db
      .from("lots")
      .update({
        sold: newSold,
        status: newSold >= lot.quantity ? "esgotado" : lot.status,
      })
      .eq("id", lot.id);
  } else if (status === "DECLINED") {
    await db.from("orders").update({ status: "recusado" }).eq("id", order.id);
  }

  return NextResponse.json({ received: true });
}
