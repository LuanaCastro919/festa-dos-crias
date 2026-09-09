import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ result: "invalido" });
  }

  const db = supabaseAdmin();
  const { data: ticket } = await db
    .from("tickets")
    .select("*")
    .eq("ticket_code", code.trim().toUpperCase())
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ result: "invalido" });
  }
  if (ticket.checkin_status === "realizado") {
    return NextResponse.json({ result: "usado", ticket });
  }
  return NextResponse.json({ result: "valido", ticket });
}
