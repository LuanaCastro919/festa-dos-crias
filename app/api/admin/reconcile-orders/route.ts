import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPaymentStatus } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/process-payment";
import { requireAdmin } from "@/lib/require-admin";

/**
 * Confere no Asaas o status real de todo pedido que ainda está "pendente"
 * no nosso banco. Serve pra recuperar pedidos em que o comprador pagou mas
 * fechou a aba antes da confirmação automática rodar (e o webhook, por
 * algum motivo, não chegou a tempo).
 */
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: pendingOrders } = await db
    .from("orders")
    .select("id, qty, lot_id, pagbank_charge_id, buyer_name, total_cents")
    .eq("status", "pendente")
    .not("pagbank_charge_id", "is", null);

  const results: { buyerName: string; totalCents: number; result: string }[] = [];
  let confirmed = 0;

  for (const order of pendingOrders ?? []) {
    // eslint-disable-next-line no-await-in-loop
    const remote = await getPaymentStatus(order.pagbank_charge_id as string);

    if (remote?.status === "RECEIVED" || remote?.status === "CONFIRMED") {
      // eslint-disable-next-line no-await-in-loop
      await markOrderPaid(order.id, order.qty, order.lot_id, remote.paidAt);
      confirmed++;
      results.push({
        buyerName: order.buyer_name,
        totalCents: order.total_cents,
        result: "confirmado agora",
      });
    } else if (remote?.status === "OVERDUE") {
      // eslint-disable-next-line no-await-in-loop
      await db.from("orders").update({ status: "expirado" }).eq("id", order.id);
      results.push({
        buyerName: order.buyer_name,
        totalCents: order.total_cents,
        result: "expirado (não foi pago)",
      });
    } else {
      results.push({
        buyerName: order.buyer_name,
        totalCents: order.total_cents,
        result: `ainda pendente (${remote?.status ?? "desconhecido"})`,
      });
    }
  }

  return NextResponse.json({
    checked: (pendingOrders ?? []).length,
    confirmed,
    results,
  });
}
