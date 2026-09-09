import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import LotsGrid from "@/components/LotsGrid";
import { supabasePublic } from "@/lib/supabase-public";

export const revalidate = 0;

export default async function IngressosPage() {
  const db = supabasePublic();
  const { data: lots } = await db.from("lots").select("*").order("position");
  const current = (lots ?? []).find((l) => l.status === "ativo");

  return (
    <>
      <PublicNav active="ingressos" />
      <section className="section wrap" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div className="section-kicker">INGRESSOS</div>
          <h2 className="section-title">
            Escolha a quantidade.
            <br />O lote já está definido.
          </h2>
          <p className="section-desc">
            {current
              ? `O lote vigente agora é o ${current.name}. Assim que ele esgotar, o próximo lote abre automaticamente com um novo preço.`
              : "Todos os lotes estão esgotados no momento."}
          </p>
        </div>
        <LotsGrid lots={lots ?? []} />
      </section>
      <Footer />
    </>
  );
}
