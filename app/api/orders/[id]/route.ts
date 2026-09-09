import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = supabaseAdmin();

  const { data: order, error } = await db
    .from("orders")
    .select("*, lots(name)")
    .eq("id", params.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
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
