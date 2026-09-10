import { supabaseAdmin } from "./supabase-admin";
import { generateTicketCode } from "./tickets";

/**
 * Marca um pedido como pago e gera os ingressos. Seguro para ser chamado
 * mais de uma vez para o mesmo pedido (pelo webhook E pela checagem ativa
 * de status) — a atualização condicional (`eq("status","pendente")`) garante
 * que só uma das chamadas realmente processa a geração dos ingressos.
 */
export async function markOrderPaid(orderId: string, qty: number, lotId: number, paidAt?: string) {
  const db = supabaseAdmin();

  const { data: claimed } = await db
    .from("orders")
    .update({ status: "pago", paid_at: paidAt ?? new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pendente")
    .select();

  if (!claimed || claimed.length === 0) {
    // outro processo já tratou esse pedido (ou ele não estava mais pendente)
    return;
  }

  const order = claimed[0];

  const { data: lot } = await db.from("lots").select("*").eq("id", lotId).single();
  if (!lot) return;

  const ticketRows = [];
  for (let i = 0; i < qty; i++) {
    let code = generateTicketCode();
    // eslint-disable-next-line no-await-in-loop
    let { data: exists } = await db
      .from("tickets")
      .select("id")
      .eq("ticket_code", code)
      .maybeSingle();
    while (exists) {
      code = generateTicketCode();
      // eslint-disable-next-line no-await-in-loop
      const retry = await db.from("tickets").select("id").eq("ticket_code", code).maybeSingle();
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

  const newSold = lot.sold + qty;
  await db
    .from("lots")
    .update({ sold: newSold, status: newSold >= lot.quantity ? "esgotado" : lot.status })
    .eq("id", lot.id);
}
