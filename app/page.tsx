import PublicNav from "@/components/PublicNav";
import Footer from "@/components/Footer";
import LotsGrid from "@/components/LotsGrid";
import { EVENT } from "@/lib/event";
import { supabasePublic } from "@/lib/supabase-public";

export const revalidate = 0;

export default async function HomePage() {
  const db = supabasePublic();
  const { data: lots } = await db.from("lots").select("*").order("position");

  return (
    <>
      <PublicNav active="home" />
      <section className="hero">
        <div className="fog" />
        <div className="wrap hero-inner">
          <div className="eyebrow">
            <span className="dot" /> VOCÊ ESTÁ CONVIDADO PARA O LADO SOMBRIO
          </div>
          <h1 className="hero-title">
            BAILE
            <br />
            DOS
            <br />
            <span className="line-red">CRIAS</span>
          </h1>
          <div className="hero-sub">{EVENT.sub}</div>
          <p className="hero-tag">
            Uma noite para os crias. Prepare sua fantasia — você não vai querer ficar de
            fora dessa noite.
          </p>
          <div className="hero-actions">
            <a href="/ingressos">
              <button className="btn btn-primary">Comprar ingresso</button>
            </a>
            <a href="/ingressos">
              <button className="btn btn-outline">Ver ingressos</button>
            </a>
          </div>
        </div>
      </section>

      <div className="info-strip">
        <div className="wrap info-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="info-item">
            <div className="k">📅 DATA</div>
            <div className="v">{EVENT.date}</div>
          </div>
          <div className="info-item">
            <div className="k">📍 LOCAL</div>
            <div className="v">{EVENT.local}</div>
          </div>
          <div className="info-item">
            <div className="k">⏰ HORÁRIO</div>
            <div className="v">{EVENT.time}</div>
          </div>
        </div>
      </div>

      <section className="section wrap">
        <div className="section-head">
          <div className="section-kicker">LOTE ÚNICO + PROMOÇÕES</div>
          <h2 className="section-title">
            Um lote único.
            <br />E promoções pra vir acompanhado.
          </h2>
          <p className="section-desc">
            Não existem categorias como pista, VIP ou camarote — todo mundo entra da
            mesma forma, pelo Lote Único. Vai com mais gente? Na Promoção Casadinha você
            leva 2 ingressos juntos por um preço especial, e na Promoção em Grupo, a
            partir de 3 pessoas, cada ingresso sai mais barato. Cada ingresso tem o seu
            próprio QR Code.
          </p>
        </div>
        <LotsGrid lots={lots ?? []} />
      </section>
      <Footer />
    </>
  );
}
