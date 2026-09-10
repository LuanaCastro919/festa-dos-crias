import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOrderStatus } from "@/lib/pagbank";
import { markOrderPaid } from "@/lib/process-payment";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = supabaseAdmin();

  let { data: order, error } = await db
    .from("orders")
    .select("*, lots(name)")
    .eq("id", params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  // plano B: se o pedido ainda está pendente, confere direto na API do
  // PagBank (o webhook pode demorar ou falhar em chegar)
  if (order.status === "pendente" && order.pagbank_order_id) {
    const remote = await getOrderStatus(order.pagbank_order_id);
    if (remote?.status === "PAID") {
      await markOrderPaid(order.id, order.qty, order.lot_id, remote.paidAt);
      const { data: refreshed } = await db
        .from("orders")
        .select("*, lots(name)")
        .eq("id", params.id)
        .single();
      if (refreshed) order = refreshed;
    } else if (remote?.status === "DECLINED") {
      await db.from("orders").update({ status: "recusado" }).eq("id", order.id);
      order.status = "recusado";
    }
  }

  let tickets: any[] = [];
  if (order.status === "pago") {
    const { data } = await db
      .from("tickets")
      .select("id, ticket_code, lot_name, buyer_name, price_paid_cents, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    tickets = data ?? [];
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    lotName: (order as any).lots?.name ?? "",
    qty: order.qty,
    totalCents: order.total_cents,
    pixQrText: order.pix_qr_text,
    pixQrImageUrl: order.pix_qr_image_url,
    pixExpiration: order.pix_expiration,
    tickets,
  });
}
