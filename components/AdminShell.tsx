"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { EVENT } from "@/lib/event";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard" },
  { key: "lotes", label: "Lotes", href: "/admin/lotes" },
  { key: "compradores", label: "Compradores", href: "/admin/compradores" },
  { key: "checkin", label: "Check-in", href: "/admin/checkin" },
];

export default function AdminShell({
  active,
  userEmail,
  children,
}: {
  active: string;
  userEmail?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-shell">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <b>{EVENT.name}</b>
          <span>PAINEL ADMIN</span>
        </div>
        <div className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={active === item.key ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="admin-role">
          Logado como
          <br />
          <b style={{ color: "#fff" }}>{userEmail || "admin"}</b>
          <br />
          <a onClick={logout} style={{ color: "var(--red)", cursor: "pointer", fontWeight: 600 }}>
            Sair
          </a>
        </div>
      </div>
      <div>
        <div className="mobile-admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className={active === item.key ? "active" : ""}>
              {item.label}
            </Link>
          ))}
          <a onClick={logout}>Sair</a>
        </div>
        <div className="admin-main">{children}</div>
      </div>
    </div>
  );
}
