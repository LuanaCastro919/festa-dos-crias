import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createPixCharge } from "@/lib/asaas";
import { SERVICE_FEE_CENTS } from "@/lib/event";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, cpf, email, whatsapp, lotId, qty } = body as {
      name: string;
      cpf: string;
      email: string;
      whatsapp: string;
      lotId: number;
      qty: number;
    };

    if (!name || !cpf || !email || !whatsapp || !lotId || !qty) {
      return NextResponse.json(
        { error: "Preencha todos os campos." },
        { status: 400 }
      );
    }
    if (qty < 1 || qty > 8) {
      return NextResponse.json(
        { error: "Quantidade inválida (máximo 8 por compra)." },
        { status: 400 }
      );
    }

    const db = supabaseAdmin();

    const { data: lot, error: lotErr } = await db
      .from("lots")
      .select("*")
      .eq("id", lotId)
      .single();

    if (lotErr || !lot) {
      return NextResponse.json(
        { error: "Lote não encontrado." },
        { status: 404 }
      );
    }
    if (lot.status === "esgotado" || lot.status === "encerrado") {
      return NextResponse.json(
        { error: "Este lote não está mais disponível." },
        { status: 409 }
      );
    }

    // soma quantos ingressos já estão reservados por pedidos pendentes
    // (aguardando pagamento e ainda dentro da validade do QR) para não vender além do estoque
    const { data: pendingOrders } = await db
      .from("orders")
      .select("qty, pix_expiration")
      .eq("lot_id", lotId)
      .eq("status", "pendente");

    const now = Date.now();
    const pendingQty = (pendingOrders ?? [])
      .filter((o) => !o.pix_expiration || new Date(o.pix_expiration).getTime() > now)
      .reduce((sum, o) => sum + o.qty, 0);

    const available = lot.quantity - lot.sold - pendingQty;
    if (qty > available) {
      return NextResponse.json(
        {
          error:
            available <= 0
              ? "Este lote acabou de esgotar."
              : `Restam apenas ${available} ingresso(s) neste lote.`,
        },
        { status: 409 }
      );
    }

    const totalCents = lot.price_cents * qty + SERVICE_FEE_CENTS;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCpf = cpf.replace(/\D/g, "");

    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        buyer_name: name,
        cpf: normalizedCpf,
        email: normalizedEmail,
        whatsapp,
        lot_id: lotId,
        qty,
        total_cents: totalCents,
        payment_method: "PIX",
        status: "pendente",
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: "Não foi possível criar o pedido." },
        { status: 500 }
      );
    }

    try {
      const pix = await createPixCharge({
        referenceId: order.id,
        description: `${lot.name} — Baile dos Crias (${qty}x)`,
        amountCents: totalCents,
        buyerName: name,
        buyerEmail: email,
        buyerCpf: cpf,
        buyerPhone: whatsapp,
      });

      await db
        .from("orders")
        .update({
          // reaproveitamos estas duas colunas do banco para guardar os IDs do Asaas
          pagbank_order_id: pix.asaasCustomerId,
          pagbank_charge_id: pix.asaasPaymentId,
          pix_qr_text: pix.qrText,
          pix_qr_image_url: pix.qrImageUrl,
          pix_expiration: pix.expiration,
        })
        .eq("id", order.id);

      return NextResponse.json({
        orderId: order.id,
        pixQrText: pix.qrText,
        pixQrImageUrl: pix.qrImageUrl,
        pixExpiration: pix.expiration,
        totalCents,
      });
    } catch (pixError: any) {
      // se o Asaas falhar, não deixa o pedido travado como pendente pra sempre
      await db
        .from("orders")
        .update({ status: "recusado" })
        .eq("id", order.id);

      return NextResponse.json(
        { error: pixError.message || "Falha ao gerar cobrança PIX." },
        { status: 502 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro inesperado ao processar o pedido." },
      { status: 500 }
    );
  }
}
