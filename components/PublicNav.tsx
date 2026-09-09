import Link from "next/link";
import { EVENT } from "@/lib/event";

export default function PublicNav({ active }: { active?: string }) {
  const links = [
    { href: "/", label: "Início", key: "home" },
    { href: "/ingressos", label: "Ingressos", key: "ingressos" },
    { href: "/meus-ingressos", label: "Meus Ingressos", key: "meus-ingressos" },
  ];
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <b>{EVENT.name}</b>
          <span>{EVENT.sub}</span>
        </Link>
        <div className="navlinks">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`desktop-link ${active === l.key ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/ingressos">
            <button className="nav-cta">Comprar ingresso</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
