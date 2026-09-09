import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const db = supabaseAdmin();

  let query = db
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  const search = sp.get("search");
  const lotId = sp.get("lotId");
  const checkinStatus = sp.get("checkinStatus");
  const dateFrom = sp.get("dateFrom");
  const dateTo = sp.get("dateTo");

  if (lotId) query = query.eq("lot_id", Number(lotId));
  if (checkinStatus) query = query.eq("checkin_status", checkinStatus);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  const { data: tickets, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Falha ao buscar ingressos." }, { status: 500 });
  }

  let rows = tickets ?? [];
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (t) =>
        t.buyer_name.toLowerCase().includes(q) ||
        t.cpf.includes(q) ||
        t.ticket_code.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ tickets: rows });
}
