import Link from "next/link";
import { EVENT } from "@/lib/event";

export default function Footer() {
  return (
    <div className="footer wrap">
      © 2026 <b>{EVENT.name}</b> — {EVENT.sub}. Todos os direitos reservados. ·{" "}
      <Link href="/admin/login" style={{ textDecoration: "underline" }}>
        Acesso administrativo
      </Link>
    </div>
  );
}
