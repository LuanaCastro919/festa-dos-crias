import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import CheckoutClient from "@/components/CheckoutClient";
import { supabasePublic } from "@/lib/supabase-public";

export const revalidate = 0;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { lot?: string };
}) {
  const lotId = Number(searchParams.lot);
  const db = supabasePublic();
  const { data: lot } = lotId
    ? await db.from("lots").select("*").eq("id", lotId).single()
    : { data: null };

  return (
    <>
      <PublicNav />
      <section className="section wrap" style={{ maxWidth: 640, paddingTop: 64 }}>
        {lot ? (
          <CheckoutClient lot={lot} />
        ) : (
          <div className="section-head">
            <h2 className="section-title">Lote não encontrado</h2>
            <p className="section-desc">
              Volte para a página de ingressos e escolha um lote disponível.
            </p>
            <a href="/ingressos">
              <button className="btn btn-primary" style={{ marginTop: 20 }}>
                Ver ingressos
              </button>
            </a>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
