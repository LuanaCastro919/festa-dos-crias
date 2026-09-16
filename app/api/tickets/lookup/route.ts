import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateTicketQrDataUrl } from "@/lib/tickets";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json({ tickets: [] });
  }

  const db = supabaseAdmin();
  const isEmail = query.includes("@");
  const column = isEmail ? "email" : "cpf";
  const value = isEmail ? query.toLowerCase() : query.replace(/\D/g, "");

  const { data: tickets } = await db
    .from("tickets")
    .select("id, ticket_code, lot_name, buyer_name, price_paid_cents, checkin_status, created_at")
    .eq(column, value)
    .order("created_at", { ascending: false });

  const ticketsWithQr = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      ...t,
      qrDataUrl: await generateTicketQrDataUrl(t.ticket_code),
    }))
  );

  return NextResponse.json({ tickets: ticketsWithQr });
}
