import { NextRequest, NextResponse } from "next/server";
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
  return NextResponse.json({ lots: lots ?? [] });
}

export async function PATCH(req: NextRequest) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Só administradores podem editar lotes." },
      { status: 403 }
    );
  }

  const { id, priceCents, status } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id do lote é obrigatório." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof priceCents === "number" && priceCents > 0) updates.price_cents = priceCents;
  if (typeof status === "string") updates.status = status;

  const db = supabaseAdmin();
  const { data: lot, error } = await db
    .from("lots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Falha ao atualizar lote." }, { status: 500 });
  }
  return NextResponse.json({ lot });
}
