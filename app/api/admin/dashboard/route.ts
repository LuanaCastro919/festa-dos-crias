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
  const revenueCents = lotsList.reduce((s, l) => s + l.sold * l.price_cents, 0);

  return NextResponse.json({
    lots: lotsList,
    totalSold,
    revenueCents,
    avgTicketCents: totalSold ? Math.round(revenueCents / totalSold) : 0,
    totalTickets: totalTickets ?? 0,
    totalCheckins: totalCheckins ?? 0,
  });
}
