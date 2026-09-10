import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAsaasWebhookToken } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/process-payment";

export async function POST(req: NextRequest) {
  const token = req.headers.get("asaas-access-token");
  if (!verifyAsaasWebhookToken(token)) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const payment = payload.payment;
  const event: string | undefined = payload.event;
  if (!payment?.id || !event) {
    return NextResponse.json({ received: true });
  }

  const db = supabaseAdmin();

  // pagbank_charge_id guarda o id da cobrança (payment) no Asaas
  const { data: order } = await db
    .from("orders")
    .select("*")
    .eq("pagbank_charge_id", payment.id)
    .maybeSingle();

  if (!order || order.status === "pago") {
    return NextResponse.json({ received: true });
  }

  if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
    await markOrderPaid(order.id, order.qty, order.lot_id, payment.paymentDate);
  } else if (event === "PAYMENT_OVERDUE") {
    await db.from("orders").update({ status: "expirado" }).eq("id", order.id);
  }

  return NextResponse.json({ received: true });
}
