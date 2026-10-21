import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: lots } = await db.from("lots").select("*").order("position");
  const { count: totalCheckins } = await db
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("checkin_status", "realizado");
  const { count: totalTickets } = await db
    .from("tickets")
    .select("id", { count: "exact", head: true });

  const lotsList = lots ?? [];
  const totalSold = lotsList.reduce((s, l) => s + l.sold, 0);

  // receita real = soma do que cada ingresso pagou (correto também para combos)
  const revenueByLot: Record<number, number> = {};
  let revenueCents = 0;
  for (let from = 0; ; from += 1000) {
    const { data: rows } = await db
      .from("tickets")
      .select("lot_id, price_paid_cents")
      .range(from, from + 999);
    if (!rows || rows.length === 0) break;
    for (const r of rows) {
      revenueCents += r.price_paid_cents;
      revenueByLot[r.lot_id] = (revenueByLot[r.lot_id] ?? 0) + r.price_paid_cents;
    }
    if (rows.length < 1000) break;
  }

  return NextResponse.json({
    lots: lotsList.map((l) => ({ ...l, revenue_cents: revenueByLot[l.id] ?? 0 })),
    totalSold,
    revenueCents,
    avgTicketCents: totalSold ? Math.round(revenueCents / totalSold) : 0,
    totalTickets: totalTickets ?? 0,
    totalCheckins: totalCheckins ?? 0,
  });
}
