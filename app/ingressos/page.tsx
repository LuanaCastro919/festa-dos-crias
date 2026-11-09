import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import LotsGrid from "@/components/LotsGrid";
import { supabasePublic } from "@/lib/supabase-public";

export const revalidate = 0;

export default async function IngressosPage() {
  const db = supabasePublic();
  const { data: lots } = await db.from("lots").select("*").eq("hidden", false).order("position");

  return (
    <>
      <PublicNav active="ingressos" />
      <section className="section wrap" style={{ paddingTop: 56 }}>
        <div className="section-head">
          <div className="section-kicker">INGRESSOS</div>
          <h2 className="section-title">
            Escolha como você vai.
            <br />Sozinho, em dupla ou em grupo.
          </h2>
          <p className="section-desc">
            O Lote Único vale para todo mundo. Para vir acompanhado, aproveite a
            Promoção Casadinha (2 ingressos juntos) ou a Promoção em Grupo (a partir de
            3 pessoas, com preço menor por ingresso). São no máximo 8 ingressos por
            compra, e cada um tem o seu QR Code.
          </p>
        </div>
        <LotsGrid lots={lots ?? []} />
      </section>
      <Footer />
    </>
  );
}
