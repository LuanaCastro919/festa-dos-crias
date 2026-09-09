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
    return NextResponse.json({ error: "Código inválido." }, { status: 400 });
  }

  const db = supabaseAdmin();
  const cleanCode = code.trim().toUpperCase();

  const { data: ticket } = await db
    .from("tickets")
    .select("*")
    .eq("ticket_code", cleanCode)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }
  if (ticket.checkin_status === "realizado") {
    return NextResponse.json({ error: "Ingresso já utilizado.", ticket }, { status: 409 });
  }

  const { data: updated } = await db
    .from("tickets")
    .update({ checkin_status: "realizado", checkin_at: new Date().toISOString() })
    .eq("ticket_code", cleanCode)
    .select()
    .single();

  return NextResponse.json({ ticket: updated });
}
